from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Dialog Hero"
    api_prefix: str = "/api/v1"
    cors_origins: list[str] = ["http://localhost:5173"]

    # Chatterbox TTS
    chb_base_url: str = "http://localhost:4123/v1/audio/speech"
    audio_dir: Path = Path("audio")

    model_config = {"env_prefix": "DH_"}


settings = Settings()
