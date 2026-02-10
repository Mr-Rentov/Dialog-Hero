import hashlib
import logging
from pathlib import Path

import httpx
from pydantic import BaseModel

from config import settings

logger = logging.getLogger(__name__)


class VoiceInfo(BaseModel):
    voice_id: str
    name: str
    language: str
    gender: str


# Static voice catalogue – represents voices available on the Chatterbox server.
AVAILABLE_VOICES: list[VoiceInfo] = [
    VoiceInfo(voice_id="male_1", name="Markus", language="de", gender="male"),
    VoiceInfo(voice_id="male_2", name="Thomas", language="de", gender="male"),
    VoiceInfo(voice_id="male_3", name="Stefan", language="de", gender="male"),
    VoiceInfo(voice_id="male_4", name="Andreas", language="de", gender="male"),
    VoiceInfo(voice_id="male_5", name="Michael", language="de", gender="male"),
    VoiceInfo(voice_id="male_6", name="Klaus", language="de", gender="male"),
    VoiceInfo(voice_id="male_7", name="Jürgen", language="de", gender="male"),
    VoiceInfo(voice_id="female_1", name="Anna", language="de", gender="female"),
    VoiceInfo(voice_id="female_2", name="Katrin", language="de", gender="female"),
    VoiceInfo(voice_id="female_3", name="Sabine", language="de", gender="female"),
    VoiceInfo(voice_id="female_4", name="Maria", language="de", gender="female"),
    VoiceInfo(voice_id="female_5", name="Julia", language="de", gender="female"),
    VoiceInfo(voice_id="female_6", name="Monika", language="de", gender="female"),
    VoiceInfo(voice_id="female_7", name="Petra", language="de", gender="female"),
    VoiceInfo(voice_id="narrator", name="Erzähler", language="de", gender="male"),
]

# Endings that hint at a female character name (simple heuristic for German).
_FEMALE_HINTS = ("a", "e", "ia", "ie", "ine", "ina", "ita", "ika")


class TTSError(Exception):
    """Raised when TTS generation fails."""


class ChatterboxService:
    def __init__(self) -> None:
        self.base_url = settings.chb_base_url
        self.timeout = 120.0  # TTS generation can be slow

    # ------------------------------------------------------------------
    # Voice catalogue
    # ------------------------------------------------------------------

    def list_voices(self) -> list[VoiceInfo]:
        return AVAILABLE_VOICES

    # ------------------------------------------------------------------
    # Voice assignment
    # ------------------------------------------------------------------

    def assign_voices(self, characters: list[str]) -> dict[str, str]:
        """Deterministically assign distinct voices to characters."""
        male_voices = [v for v in AVAILABLE_VOICES if v.gender == "male" and v.voice_id != "narrator"]
        female_voices = [v for v in AVAILABLE_VOICES if v.gender == "female"]

        mapping: dict[str, str] = {}
        male_idx = 0
        female_idx = 0

        for name in characters:
            gender = self._guess_gender(name)
            if gender == "female":
                voice = female_voices[female_idx % len(female_voices)]
                female_idx += 1
            else:
                voice = male_voices[male_idx % len(male_voices)]
                male_idx += 1
            mapping[name] = voice.voice_id

        return mapping

    @staticmethod
    def _guess_gender(name: str) -> str:
        """Simple heuristic: if the name ends with a typical female suffix → female."""
        lower = name.strip().lower()
        if lower.endswith(_FEMALE_HINTS):
            return "female"
        return "male"

    # ------------------------------------------------------------------
    # Speech generation
    # ------------------------------------------------------------------

    def generate_speech(
        self,
        text: str,
        voice: str,
        language: str = "de",
        exaggeration: float = 0.5,
    ) -> bytes:
        """Call the Chatterbox TTS server (OpenAI-compatible endpoint).

        Returns raw audio bytes (MP3).

        If the TTS server is unavailable, falls back to writing a small
        deterministic dummy MP3 so that development can continue without
        a running Chatterbox instance.
        """
        payload = {
            "model": "chatterbox",
            "voice": voice,
            "input": text,
            "language": language,
            "exaggeration": exaggeration,
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(self.base_url, json=payload)
                response.raise_for_status()
                return response.content
        except httpx.HTTPStatusError as exc:
            logger.error("TTS server returned %s: %s", exc.response.status_code, exc.response.text)
            raise TTSError(f"TTS-Server Fehler: {exc.response.status_code}") from exc
        except httpx.ConnectError:
            logger.warning("TTS server not reachable – generating dummy audio.")
            return self._dummy_audio(text, voice)
        except httpx.HTTPError as exc:
            logger.warning("TTS request failed (%s) – generating dummy audio.", exc)
            return self._dummy_audio(text, voice)

    # ------------------------------------------------------------------
    # Dummy fallback (MVP: allows development without real TTS server)
    # ------------------------------------------------------------------

    @staticmethod
    def _dummy_audio(text: str, voice: str) -> bytes:
        """Return a tiny valid MP3 frame so files are non-empty.

        The content is deterministic based on text+voice so repeated calls
        produce identical output (useful for testing).
        """
        # Minimal valid MP3 frame (MPEG1 Layer3, 128kbps, 44100Hz, silence)
        mp3_header = bytes([
            0xFF, 0xFB, 0x90, 0x00,  # MP3 sync + header
        ])
        # Pad with zeros to form a valid-ish frame (~417 bytes for 128kbps)
        tag = hashlib.md5(f"{voice}:{text}".encode()).digest()
        frame_data = tag + b"\x00" * (417 - len(mp3_header) - len(tag))
        return mp3_header + frame_data

    # ------------------------------------------------------------------
    # File storage helper
    # ------------------------------------------------------------------

    @staticmethod
    def save_audio(
        audio_data: bytes,
        script_id: int,
        scene_number: int,
        order_index: int,
    ) -> str:
        """Save audio bytes to the filesystem and return the relative path."""
        rel_dir = Path("audio") / str(script_id) / str(scene_number)
        abs_dir = settings.audio_dir / str(script_id) / str(scene_number)
        abs_dir.mkdir(parents=True, exist_ok=True)

        filename = f"dialog_{order_index}.mp3"
        (abs_dir / filename).write_bytes(audio_data)

        return str(rel_dir / filename)
