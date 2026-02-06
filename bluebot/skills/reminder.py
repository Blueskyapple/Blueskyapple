"""Reminder / scheduled message skill."""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

from bluebot.skills.base import Skill


class ReminderSkill(Skill):
    """Create time-based reminders stored on disk."""

    def __init__(self, data_dir: Path) -> None:
        self._file = data_dir / "reminders.json"
        if not self._file.exists():
            self._file.write_text("[]")

    @property
    def name(self) -> str:
        return "reminder"

    @property
    def description(self) -> str:
        return (
            "Set a reminder. Provide 'message' and 'delay_minutes'. "
            "Use action='list' to see pending reminders."
        )

    @property
    def args_schema(self) -> dict[str, Any]:
        return {
            "action": "'set' or 'list'",
            "message": "string (for set)",
            "delay_minutes": "number (for set)",
        }

    def _load(self) -> list[dict[str, Any]]:
        try:
            return json.loads(self._file.read_text())
        except (json.JSONDecodeError, FileNotFoundError):
            return []

    def _save(self, data: list[dict[str, Any]]) -> None:
        self._file.write_text(json.dumps(data, indent=2))

    def run(self, **kwargs: Any) -> str:
        action = kwargs.get("action", "set")
        if action == "list":
            return self._list_reminders()
        return self._set_reminder(
            kwargs.get("message", ""),
            kwargs.get("delay_minutes", 0),
        )

    def _set_reminder(self, message: str, delay: float) -> str:
        if not message:
            return "Error: 'message' is required."
        if delay <= 0:
            return "Error: 'delay_minutes' must be a positive number."
        due = time.time() + delay * 60
        reminders = self._load()
        reminders.append({"message": message, "due": due})
        self._save(reminders)
        return f"Reminder set: '{message}' in {delay} minute(s)."

    def _list_reminders(self) -> str:
        reminders = self._load()
        if not reminders:
            return "No pending reminders."
        now = time.time()
        lines = []
        for r in reminders:
            remaining = max(0, r["due"] - now)
            mins = remaining / 60
            lines.append(f"- {r['message']}  (in {mins:.1f} min)")
        return "Pending reminders:\n" + "\n".join(lines)

    def check_due(self) -> list[str]:
        """Return messages for reminders that are now due, and remove them."""
        reminders = self._load()
        now = time.time()
        due = [r for r in reminders if r["due"] <= now]
        remaining = [r for r in reminders if r["due"] > now]
        if due:
            self._save(remaining)
        return [r["message"] for r in due]
