import re

from models.script import ScriptElement


class MoodAnalyzer:
    """Heuristic mood detection for screenplay dialogue elements."""

    # Parenthetical keywords → mood label
    _PARENTHETICAL_MAP: dict[str, str] = {
        "wütend": "angry",
        "zornig": "angry",
        "ärgerlich": "angry",
        "aggressiv": "angry",
        "fröhlich": "happy",
        "lachend": "happy",
        "freudig": "happy",
        "traurig": "sad",
        "weinend": "sad",
        "verzweifelt": "sad",
        "ängstlich": "sad",
        "flüsternd": "whisper",
        "leise": "whisper",
        "flüstert": "whisper",
        "schreiend": "shout",
        "laut": "shout",
        "brüllend": "shout",
        "aufgeregt": "excited",
        "begeistert": "excited",
        "hektisch": "excited",
        "freundlich": "happy",
        "sanft": "neutral",
        "ruhig": "neutral",
    }

    # Text-level keyword patterns → mood
    _ANGRY_WORDS = re.compile(
        r"\b(nein|hör auf|stopp|verdammt|verflucht|idiot|halt)\b", re.IGNORECASE
    )
    _HAPPY_WORDS = re.compile(
        r"\b(danke|bitte|wunderbar|großartig|fantastisch|schön|liebe)\b", re.IGNORECASE
    )
    _SAD_WORDS = re.compile(
        r"\b(leider|schade|tut mir leid|traurig|verloren|allein|einsam)\b", re.IGNORECASE
    )

    # Exaggeration mapping
    _EXAGGERATION: dict[str, float] = {
        "neutral": 0.3,
        "happy": 0.5,
        "excited": 0.7,
        "angry": 0.7,
        "sad": 0.4,
        "whisper": 0.2,
        "shout": 0.8,
    }

    def analyze(self, element: ScriptElement, parenthetical_text: str | None = None) -> str:
        """Determine mood for a DIALOGUE element.

        Args:
            element: A ScriptElement with element_type == "DIALOGUE".
            parenthetical_text: Optional text from a preceding PARENTHETICAL element.

        Returns:
            Mood label string (e.g. "neutral", "angry", "happy").
        """
        # 1. Check parenthetical keywords
        if parenthetical_text:
            lower = parenthetical_text.lower()
            for keyword, mood in self._PARENTHETICAL_MAP.items():
                if keyword in lower:
                    return mood

        # 2. Heuristic analysis of dialogue text
        text = element.text

        exclamation_count = text.count("!")
        question_count = text.count("?")

        has_angry_words = bool(self._ANGRY_WORDS.search(text))
        has_happy_words = bool(self._HAPPY_WORDS.search(text))
        has_sad_words = bool(self._SAD_WORDS.search(text))

        # Shouting: many exclamation marks + angry words
        if exclamation_count >= 2 and has_angry_words:
            return "shout"

        # Angry: angry keywords + at least one exclamation
        if has_angry_words and exclamation_count >= 1:
            return "angry"

        # Excited: multiple exclamation marks without anger
        if exclamation_count >= 2:
            return "excited"

        # Happy
        if has_happy_words:
            return "happy"

        # Sad
        if has_sad_words:
            return "sad"

        # Questioning / unsure (mild – keep neutral for now)
        if question_count >= 2:
            return "neutral"

        return "neutral"

    def map_mood_to_exaggeration(self, mood: str) -> float:
        return self._EXAGGERATION.get(mood, 0.3)
