import io
import logging
import tempfile

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models.script import Character, Scene, Script, ScriptElement
from schemas.script import (
    AudioStatusResponse,
    GenerateAudioResponse,
    PlaylistItem,
    PlaylistResponse,
    ScriptDetailResponse,
    UploadResponse,
)
from models.user import User
from services.auth_service import get_current_user
from services.mood_analyzer import MoodAnalyzer
from services.pdf_parser import parse_script_from_pdf
from services.tts_service import ChatterboxService, TTSError

logger = logging.getLogger(__name__)

router = APIRouter()


# ------------------------------------------------------------------
# Existing endpoints
# ------------------------------------------------------------------


@router.post("/scripts/upload", response_model=UploadResponse)
async def upload_script(
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Nur PDF-Dateien sind erlaubt.")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Die Datei ist leer.")

    try:
        parsed = parse_script_from_pdf(io.BytesIO(content))
    except Exception:
        raise HTTPException(
            status_code=422,
            detail="Die PDF-Datei konnte nicht verarbeitet werden.",
        )

    script = Script(
        owner_id=current_user.id,
        filename=file.filename,
        title=parsed.title,
        total_scenes=len(parsed.scenes),
        total_characters=len(parsed.characters),
    )
    db.add(script)
    db.flush()

    for char_name, count in parsed.characters.items():
        db.add(Character(
            script_id=script.id,
            name=char_name,
            dialogue_count=count,
        ))

    for scene_idx, parsed_scene in enumerate(parsed.scenes):
        scene = Scene(
            script_id=script.id,
            scene_number=parsed_scene.scene_number,
            heading=parsed_scene.heading,
            scene_type=parsed_scene.scene_type,
            order_index=scene_idx,
        )
        db.add(scene)
        db.flush()

        for elem_idx, parsed_elem in enumerate(parsed_scene.elements):
            db.add(ScriptElement(
                scene_id=scene.id,
                element_type=parsed_elem.element_type,
                character_name=parsed_elem.character_name,
                text=parsed_elem.text,
                order_index=elem_idx,
            ))

    db.commit()
    db.refresh(script)

    return UploadResponse(
        id=script.id,
        filename=script.filename,
        total_scenes=script.total_scenes,
        total_characters=script.total_characters,
    )


@router.get("/scripts/{script_id}", response_model=ScriptDetailResponse)
async def get_script(script_id: int, db: Session = Depends(get_db)):
    script = db.query(Script).filter(Script.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Drehbuch nicht gefunden.")

    return script


# ------------------------------------------------------------------
# Phase 3: Audio / TTS endpoints
# ------------------------------------------------------------------


def _get_script_or_404(script_id: int, db: Session) -> Script:
    script = db.query(Script).filter(Script.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Drehbuch nicht gefunden.")
    return script


@router.post(
    "/scripts/{script_id}/generate-audio",
    response_model=GenerateAudioResponse,
)
async def generate_audio(script_id: int, db: Session = Depends(get_db)):
    """Generate TTS audio for every DIALOGUE element in a script.

    NOTE: This runs synchronously for the MVP.
    TODO: Replace with a background job (Celery / RQ / ARQ) for production.
    """
    script = _get_script_or_404(script_id, db)

    tts = ChatterboxService()
    mood_analyzer = MoodAnalyzer()

    # --- 1. Assign voices if not yet done ---
    characters = db.query(Character).filter(Character.script_id == script_id).all()
    unassigned = [c for c in characters if not c.voice_id]
    if unassigned:
        char_names = [c.name for c in characters]
        voice_map = tts.assign_voices(char_names)
        for char in characters:
            char.voice_id = voice_map.get(char.name, "male_1")
        db.flush()

    # Build quick lookup: character name → voice_id
    voice_lookup: dict[str, str] = {c.name: c.voice_id or "male_1" for c in characters}

    # --- 2. Iterate over all scenes / elements ---
    generated_count = 0
    total_dialogues = 0

    for scene in script.scenes:
        prev_parenthetical: str | None = None
        for element in scene.elements:
            if element.element_type == "PARENTHETICAL":
                prev_parenthetical = element.text
                continue

            if element.element_type != "DIALOGUE":
                prev_parenthetical = None
                continue

            total_dialogues += 1

            # Skip if audio already exists
            if element.audio_file_path:
                prev_parenthetical = None
                continue

            # Mood analysis
            if not element.mood:
                element.mood = mood_analyzer.analyze(element, prev_parenthetical)

            exaggeration = mood_analyzer.map_mood_to_exaggeration(element.mood)
            voice = voice_lookup.get(element.character_name or "", "male_1")

            # Generate audio
            try:
                audio_data = tts.generate_speech(
                    text=element.text,
                    voice=voice,
                    language="de",
                    exaggeration=exaggeration,
                )
            except TTSError as exc:
                logger.error("TTS failed for element %s: %s", element.id, exc)
                prev_parenthetical = None
                continue

            # Save to filesystem
            rel_path = tts.save_audio(
                audio_data=audio_data,
                script_id=script_id,
                scene_number=scene.scene_number,
                order_index=element.order_index,
            )
            element.audio_file_path = rel_path
            generated_count += 1
            prev_parenthetical = None

    db.commit()

    return GenerateAudioResponse(
        script_id=script_id,
        total_dialogues=total_dialogues,
        generated_count=generated_count,
        status="completed",
    )


@router.get(
    "/scripts/{script_id}/audio-status",
    response_model=AudioStatusResponse,
)
async def audio_status(script_id: int, db: Session = Depends(get_db)):
    _get_script_or_404(script_id, db)

    dialogue_elements = (
        db.query(ScriptElement)
        .join(Scene, ScriptElement.scene_id == Scene.id)
        .filter(Scene.script_id == script_id, ScriptElement.element_type == "DIALOGUE")
        .all()
    )

    total = len(dialogue_elements)
    with_audio = sum(1 for e in dialogue_elements if e.audio_file_path)

    if total == 0:
        status = "completed"
    elif with_audio == 0:
        status = "pending"
    elif with_audio < total:
        status = "in_progress"
    else:
        status = "completed"

    return AudioStatusResponse(
        script_id=script_id,
        total_dialogues=total,
        with_audio=with_audio,
        status=status,
    )


_COMMENT_TYPES = {"ACTION", "SCENE_HEADING", "PARENTHETICAL", "TRANSITION"}


@router.get(
    "/scripts/{script_id}/playlist",
    response_model=PlaylistResponse,
)
async def playlist(script_id: int, db: Session = Depends(get_db)):
    script = _get_script_or_404(script_id, db)

    items: list[PlaylistItem] = []
    for scene in script.scenes:
        for element in scene.elements:
            audio_url = None
            if element.audio_file_path:
                audio_url = f"/api/v1/audio/{element.audio_file_path}"

            items.append(PlaylistItem(
                element_id=element.id,
                script_id=script_id,
                scene_id=scene.id,
                scene_number=scene.scene_number,
                element_type=element.element_type,
                order_index=element.order_index,
                character_name=element.character_name,
                text=element.text[:120],
                audio_url=audio_url,
                is_comment=element.element_type in _COMMENT_TYPES,
            ))

    return PlaylistResponse(script_id=script_id, items=items)


# ------------------------------------------------------------------
# Download stitched MP3
# ------------------------------------------------------------------


@router.get("/scripts/{script_id}/download")
async def download_audio(
    script_id: int,
    scope: str = Query("full", pattern="^(full|scene)$"),
    scene_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    """Stitch all audio segments into a single MP3 for download."""
    from pydub import AudioSegment

    script = _get_script_or_404(script_id, db)

    # Determine which scenes to include
    if scope == "scene":
        if scene_id is None:
            raise HTTPException(status_code=400, detail="scene_id ist erforderlich bei scope=scene.")
        target_scene = db.query(Scene).filter(Scene.id == scene_id, Scene.script_id == script_id).first()
        if not target_scene:
            raise HTTPException(status_code=404, detail="Szene nicht gefunden.")
        scenes = [target_scene]
    else:
        scenes = sorted(script.scenes, key=lambda s: s.order_index)

    # Collect audio file paths in order
    audio_paths: list[tuple[str, bool]] = []  # (abs_path, is_new_scene)
    for idx, scene in enumerate(scenes):
        first_in_scene = True
        for element in sorted(scene.elements, key=lambda e: e.order_index):
            if not element.audio_file_path:
                continue
            abs_path = settings.audio_dir / element.audio_file_path.replace("audio/", "", 1)
            if abs_path.is_file():
                audio_paths.append((str(abs_path), first_in_scene and idx > 0))
                first_in_scene = False

    if not audio_paths:
        raise HTTPException(
            status_code=409,
            detail="Noch kein Audio generiert. Bitte zuerst Audio generieren.",
        )

    # Stitch audio with pauses
    silence_dialog = AudioSegment.silent(duration=300)
    silence_scene = AudioSegment.silent(duration=1000)

    combined = AudioSegment.empty()
    for abs_path, is_new_scene in audio_paths:
        if len(combined) > 0:
            combined += silence_scene if is_new_scene else silence_dialog
        try:
            fmt = "wav" if abs_path.endswith(".wav") else "mp3"
            segment = AudioSegment.from_file(abs_path, format=fmt)
            combined += segment
        except Exception:
            # Skip unreadable files (e.g. dummy stubs)
            combined += AudioSegment.silent(duration=500)

    # Export to temp file
    tmp = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False)
    combined.export(tmp.name, format="mp3")

    if scope == "scene" and scenes:
        filename = f"dialog-hero-script-{script_id}-scene-{scenes[0].scene_number}.mp3"
    else:
        filename = f"dialog-hero-script-{script_id}.mp3"

    return FileResponse(
        tmp.name,
        media_type="audio/mpeg",
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ------------------------------------------------------------------
# Static audio file serving
# ------------------------------------------------------------------


@router.get("/audio/{file_path:path}")
async def serve_audio(file_path: str):
    full_path = settings.audio_dir / file_path
    if not full_path.is_file():
        raise HTTPException(status_code=404, detail="Audio-Datei nicht gefunden.")
    media_type = "audio/wav" if file_path.endswith(".wav") else "audio/mpeg"
    return FileResponse(full_path, media_type=media_type)
