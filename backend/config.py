from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Dialog Hero"
    api_prefix: str = "/api/v1"
    cors_origins: list[str] = ["http://localhost:5173"]

    # Chatterbox TTS
    chb_base_url: str = "http://localhost:4123/v1/audio/speech"
    audio_dir: Path = Path("audio")

    # JWT Authentication
    jwt_secret_key: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 120

    model_config = {"env_prefix": "DH_"}


settings = Settings()
