from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Script(Base):
    __tablename__ = "scripts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    filename: Mapped[str] = mapped_column(String(255))
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    total_scenes: Mapped[int] = mapped_column(Integer, default=0)
    total_characters: Mapped[int] = mapped_column(Integer, default=0)

    scenes: Mapped[list["Scene"]] = relationship(
        back_populates="script", cascade="all, delete-orphan", order_by="Scene.order_index"
    )
    characters: Mapped[list["Character"]] = relationship(
        back_populates="script", cascade="all, delete-orphan"
    )


class Scene(Base):
    __tablename__ = "scenes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    script_id: Mapped[int] = mapped_column(ForeignKey("scripts.id", ondelete="CASCADE"))
    scene_number: Mapped[int] = mapped_column(Integer)
    heading: Mapped[str] = mapped_column(String(500))
    scene_type: Mapped[str] = mapped_column(String(10), default="")
    order_index: Mapped[int] = mapped_column(Integer)

    script: Mapped["Script"] = relationship(back_populates="scenes")
    elements: Mapped[list["ScriptElement"]] = relationship(
        back_populates="scene", cascade="all, delete-orphan", order_by="ScriptElement.order_index"
    )


class Character(Base):
    __tablename__ = "characters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    script_id: Mapped[int] = mapped_column(ForeignKey("scripts.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(255))
    voice_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    dialogue_count: Mapped[int] = mapped_column(Integer, default=0)

    script: Mapped["Script"] = relationship(back_populates="characters")


class ScriptElement(Base):
    __tablename__ = "script_elements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scene_id: Mapped[int] = mapped_column(ForeignKey("scenes.id", ondelete="CASCADE"))
    element_type: Mapped[str] = mapped_column(String(20))
    character_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    text: Mapped[str] = mapped_column(Text)
    order_index: Mapped[int] = mapped_column(Integer)
    mood: Mapped[str | None] = mapped_column(String(50), nullable=True)
    audio_file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)

    scene: Mapped["Scene"] = relationship(back_populates="elements")
