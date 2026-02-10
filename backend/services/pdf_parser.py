"""
PDF screenplay parser.

Parses a screenplay PDF into structured data using pdfplumber.
Uses x-coordinate positions and text formatting to classify lines as:
- SCENE_HEADING: lines starting with INT./EXT./INNEN/AUSSEN
- CHARACTER: centered, uppercase names above dialogue
- DIALOGUE: indented text below a character name
- PARENTHETICAL: text in parentheses below a character name
- ACTION: left-aligned descriptive text
- TRANSITION: right-aligned text (e.g. SCHNITT AUF:)
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import IO

import pdfplumber


@dataclass
class ParsedElement:
    element_type: str
    text: str
    character_name: str | None = None


@dataclass
class ParsedScene:
    scene_number: int
    heading: str
    scene_type: str
    elements: list[ParsedElement] = field(default_factory=list)


@dataclass
class ParsedScript:
    title: str | None
    scenes: list[ParsedScene] = field(default_factory=list)
    characters: dict[str, int] = field(default_factory=dict)


SCENE_HEADING_RE = re.compile(
    r"^\s*(INT\.?|EXT\.?|INNEN|AUSSEN|INT\s*/\s*EXT\.?|I/A\.?)\s+",
    re.IGNORECASE,
)

TRANSITION_RE = re.compile(
    r"(SCHNITT AUF|CUT TO|FADE IN|FADE OUT|FADE TO|DISSOLVE TO|BLENDE|ABBLENDE)\s*:?\s*$",
    re.IGNORECASE,
)


def _extract_scene_type(heading: str) -> str:
    heading_upper = heading.strip().upper()
    if heading_upper.startswith("EXT") or heading_upper.startswith("AUSSEN"):
        return "EXT"
    if heading_upper.startswith("INT") or heading_upper.startswith("INNEN"):
        return "INT"
    if "INT" in heading_upper and "EXT" in heading_upper:
        return "INT/EXT"
    return ""


def _is_uppercase_name(text: str) -> bool:
    """Check if text looks like a character name: mostly uppercase letters."""
    cleaned = re.sub(r"\(.*?\)", "", text).strip()
    if not cleaned or len(cleaned) < 2:
        return False
    alpha_chars = [c for c in cleaned if c.isalpha()]
    if not alpha_chars:
        return False
    upper_ratio = sum(1 for c in alpha_chars if c.isupper()) / len(alpha_chars)
    return upper_ratio > 0.8


def _normalize_name(name: str) -> str:
    """Normalize character name: strip annotations like (V.O.), (O.S.), etc."""
    name = re.sub(r"\(.*?\)", "", name)
    name = re.sub(r"\s+", " ", name).strip()
    return name


def _build_lines_from_page(page: pdfplumber.page.Page) -> list[dict]:
    """Extract text lines with positional info from a page."""
    words = page.extract_words(x_tolerance=3, y_tolerance=3, keep_blank_chars=True)
    if not words:
        return []

    page_width = page.width

    lines: list[dict] = []
    current_line_words: list[dict] = []
    current_top: float | None = None
    tolerance = 3.0

    for word in sorted(words, key=lambda w: (w["top"], w["x0"])):
        if current_top is None or abs(word["top"] - current_top) > tolerance:
            if current_line_words:
                lines.append(_make_line(current_line_words, page_width))
            current_line_words = [word]
            current_top = word["top"]
        else:
            current_line_words.append(word)

    if current_line_words:
        lines.append(_make_line(current_line_words, page_width))

    return lines


def _make_line(words: list[dict], page_width: float) -> dict:
    """Create a line dict from grouped words."""
    text = " ".join(w["text"] for w in words)
    x0 = min(w["x0"] for w in words)
    x1 = max(w["x1"] for w in words)
    top = words[0]["top"]
    center = (x0 + x1) / 2
    width = x1 - x0

    return {
        "text": text.strip(),
        "x0": x0,
        "x1": x1,
        "top": top,
        "center": center,
        "width": width,
        "page_width": page_width,
        "rel_x0": x0 / page_width,
        "rel_center": center / page_width,
        "rel_x1": x1 / page_width,
    }


def _classify_lines(lines: list[dict]) -> list[ParsedElement]:
    """Classify extracted lines into screenplay elements."""
    elements: list[ParsedElement] = []
    current_character: str | None = None
    dialogue_buffer: list[str] = []
    i = 0

    def flush_dialogue():
        nonlocal dialogue_buffer, current_character
        if dialogue_buffer and current_character:
            full_text = " ".join(dialogue_buffer)
            elements.append(ParsedElement(
                element_type="DIALOGUE",
                text=full_text,
                character_name=current_character,
            ))
            dialogue_buffer = []

    while i < len(lines):
        line = lines[i]
        text = line["text"].strip()

        if not text:
            i += 1
            continue

        # Scene heading
        if SCENE_HEADING_RE.match(text):
            flush_dialogue()
            current_character = None
            elements.append(ParsedElement(element_type="SCENE_HEADING", text=text))
            i += 1
            continue

        # Transition (right-aligned or matching pattern)
        if TRANSITION_RE.search(text) or (line["rel_x0"] > 0.55 and text.endswith(":")):
            flush_dialogue()
            current_character = None
            elements.append(ParsedElement(element_type="TRANSITION", text=text))
            i += 1
            continue

        # Character name detection: centered, uppercase, short
        is_centered = 0.3 < line["rel_center"] < 0.7
        is_short = len(text) < 50
        is_indented = line["rel_x0"] > 0.25

        if is_centered and is_short and is_indented and _is_uppercase_name(text):
            flush_dialogue()
            current_character = _normalize_name(text)
            i += 1
            continue

        # Parenthetical (in brackets, while we have a current character)
        if current_character and text.startswith("(") and text.endswith(")"):
            flush_dialogue()
            elements.append(ParsedElement(
                element_type="PARENTHETICAL",
                text=text,
                character_name=current_character,
            ))
            i += 1
            continue

        # Dialogue: indented text after a character name
        if current_character and line["rel_x0"] > 0.2:
            dialogue_buffer.append(text)
            i += 1
            continue

        # Action: left-aligned text
        flush_dialogue()
        current_character = None
        elements.append(ParsedElement(element_type="ACTION", text=text))
        i += 1

    flush_dialogue()
    return elements


def parse_script_from_pdf(file: IO[bytes]) -> ParsedScript:
    """Parse a screenplay PDF into structured data."""
    all_lines: list[dict] = []

    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            page_lines = _build_lines_from_page(page)
            all_lines.extend(page_lines)

    elements = _classify_lines(all_lines)

    # Build scenes
    scenes: list[ParsedScene] = []
    current_scene: ParsedScene | None = None
    scene_number = 0

    # Collect elements before the first scene heading into a default scene
    for elem in elements:
        if elem.element_type == "SCENE_HEADING":
            scene_number += 1
            scene_type = _extract_scene_type(elem.text)
            current_scene = ParsedScene(
                scene_number=scene_number,
                heading=elem.text,
                scene_type=scene_type,
            )
            scenes.append(current_scene)
        else:
            if current_scene is None:
                # Elements before any scene heading: create an implicit scene
                scene_number += 1
                current_scene = ParsedScene(
                    scene_number=scene_number,
                    heading="OPENING",
                    scene_type="",
                )
                scenes.append(current_scene)
            current_scene.elements.append(elem)

    # Count characters
    characters: dict[str, int] = {}
    for scene in scenes:
        for elem in scene.elements:
            if elem.element_type == "DIALOGUE" and elem.character_name:
                name = elem.character_name
                characters[name] = characters.get(name, 0) + 1

    # Try to extract title from first page (often the first centered text)
    title = None
    for line in all_lines[:10]:
        if 0.3 < line["rel_center"] < 0.7 and len(line["text"]) < 80:
            candidate = line["text"].strip()
            if not SCENE_HEADING_RE.match(candidate) and not _is_uppercase_name(candidate):
                title = candidate
                break

    return ParsedScript(title=title, scenes=scenes, characters=characters)
