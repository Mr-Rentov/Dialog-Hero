from datetime import datetime

from pydantic import BaseModel


class ScriptElementSchema(BaseModel):
    id: int
    element_type: str
    character_name: str | None
    text: str
    order_index: int
    mood: str | None
    audio_file_path: str | None

    model_config = {"from_attributes": True}


class CharacterSchema(BaseModel):
    id: int
    name: str
    voice_id: str | None
    dialogue_count: int

    model_config = {"from_attributes": True}


class SceneSchema(BaseModel):
    id: int
    scene_number: int
    heading: str
    scene_type: str
    order_index: int
    elements: list[ScriptElementSchema]

    model_config = {"from_attributes": True}


class ScriptListItem(BaseModel):
    id: int
    filename: str
    title: str | None
    uploaded_at: datetime
    total_scenes: int
    total_characters: int

    model_config = {"from_attributes": True}


class ScriptDetailResponse(BaseModel):
    id: int
    filename: str
    title: str | None
    uploaded_at: datetime
    total_scenes: int
    total_characters: int
    scenes: list[SceneSchema]
    characters: list[CharacterSchema]

    model_config = {"from_attributes": True}


class UploadResponse(BaseModel):
    id: int
    filename: str
    total_scenes: int
    total_characters: int
