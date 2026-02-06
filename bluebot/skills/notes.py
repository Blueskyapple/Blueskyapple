"""Notes & facts skill — manages persistent memory for the user."""

from __future__ import annotations

from typing import Any

from bluebot.memory import Memory
from bluebot.skills.base import Skill


class RememberFactSkill(Skill):
    def __init__(self, memory: Memory) -> None:
        self._memory = memory

    @property
    def name(self) -> str:
        return "remember"

    @property
    def description(self) -> str:
        return "Store a fact about the user for future reference."

    @property
    def args_schema(self) -> dict[str, Any]:
        return {"key": "string", "value": "string"}

    def run(self, **kwargs: Any) -> str:
        key = kwargs.get("key", "")
        value = kwargs.get("value", "")
        if not key or not value:
            return "Error: both 'key' and 'value' are required."
        self._memory.add_fact(key, value)
        return f"Remembered: {key} = {value}"


class ForgetFactSkill(Skill):
    def __init__(self, memory: Memory) -> None:
        self._memory = memory

    @property
    def name(self) -> str:
        return "forget"

    @property
    def description(self) -> str:
        return "Remove a previously stored fact."

    @property
    def args_schema(self) -> dict[str, Any]:
        return {"key": "string"}

    def run(self, **kwargs: Any) -> str:
        key = kwargs.get("key", "")
        if self._memory.remove_fact(key):
            return f"Forgot: {key}"
        return f"No fact found with key '{key}'."


class SaveNoteSkill(Skill):
    def __init__(self, memory: Memory) -> None:
        self._memory = memory

    @property
    def name(self) -> str:
        return "save_note"

    @property
    def description(self) -> str:
        return "Save a longer note under a topic name."

    @property
    def args_schema(self) -> dict[str, Any]:
        return {"topic": "string", "content": "string"}

    def run(self, **kwargs: Any) -> str:
        topic = kwargs.get("topic", "")
        content = kwargs.get("content", "")
        if not topic or not content:
            return "Error: 'topic' and 'content' are required."
        path = self._memory.save_note(topic, content)
        return f"Note saved: {path}"


class ReadNoteSkill(Skill):
    def __init__(self, memory: Memory) -> None:
        self._memory = memory

    @property
    def name(self) -> str:
        return "read_note"

    @property
    def description(self) -> str:
        return "Read a previously saved note by topic."

    @property
    def args_schema(self) -> dict[str, Any]:
        return {"topic": "string"}

    def run(self, **kwargs: Any) -> str:
        topic = kwargs.get("topic", "")
        note = self._memory.get_note(topic)
        if note is None:
            return f"No note found for topic '{topic}'."
        return note


class ListNotesSkill(Skill):
    def __init__(self, memory: Memory) -> None:
        self._memory = memory

    @property
    def name(self) -> str:
        return "list_notes"

    @property
    def description(self) -> str:
        return "List all saved note topics."

    def run(self, **kwargs: Any) -> str:
        topics = self._memory.list_notes()
        if not topics:
            return "No notes saved yet."
        return "Notes:\n" + "\n".join(f"- {t}" for t in topics)
