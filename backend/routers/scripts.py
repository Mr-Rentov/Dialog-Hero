import io

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from database import get_db
from models.script import Character, Scene, Script, ScriptElement
from schemas.script import ScriptDetailResponse, UploadResponse
from services.pdf_parser import parse_script_from_pdf

router = APIRouter()


@router.post("/scripts/upload", response_model=UploadResponse)
async def upload_script(file: UploadFile, db: Session = Depends(get_db)):
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
