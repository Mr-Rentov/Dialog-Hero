from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Dialog Hero"
    api_prefix: str = "/api/v1"
    cors_origins: list[str] = ["http://localhost:5173"]

    model_config = {"env_prefix": "DH_"}


settings = Settings()
