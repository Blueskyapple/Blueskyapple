"""Persistent file-based memory system.

Memory is stored as plain text/markdown files in a local directory,
organized by topic.  This keeps data human-readable and easy to back up.
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any


class Memory:
    """File-backed persistent memory store."""

    def __init__(self, base_dir: Path) -> None:
        self._dir = base_dir
        self._dir.mkdir(parents=True, exist_ok=True)
        self._conversations_dir = self._dir / "conversations"
        self._conversations_dir.mkdir(exist_ok=True)
        self._notes_dir = self._dir / "notes"
        self._notes_dir.mkdir(exist_ok=True)
        self._facts_file = self._dir / "facts.json"
        if not self._facts_file.exists():
            self._facts_file.write_text("[]")

    # --- Facts: short key–value pairs the bot learns about the user ---

    def get_facts(self) -> list[dict[str, str]]:
        try:
            return json.loads(self._facts_file.read_text())
        except (json.JSONDecodeError, FileNotFoundError):
            return []

    def add_fact(self, key: str, value: str) -> None:
        facts = self.get_facts()
        # Upsert
        for f in facts:
            if f["key"] == key:
                f["value"] = value
                break
        else:
            facts.append({"key": key, "value": value})
        self._facts_file.write_text(json.dumps(facts, indent=2))

    def remove_fact(self, key: str) -> bool:
        facts = self.get_facts()
        new = [f for f in facts if f["key"] != key]
        if len(new) == len(facts):
            return False
        self._facts_file.write_text(json.dumps(new, indent=2))
        return True

    # --- Notes: longer free-form text stored by topic ---

    def save_note(self, topic: str, content: str) -> Path:
        safe = "".join(c if c.isalnum() or c in "-_ " else "_" for c in topic)
        path = self._notes_dir / f"{safe}.md"
        path.write_text(content)
        return path

    def get_note(self, topic: str) -> str | None:
        safe = "".join(c if c.isalnum() or c in "-_ " else "_" for c in topic)
        path = self._notes_dir / f"{safe}.md"
        if path.exists():
            return path.read_text()
        return None

    def list_notes(self) -> list[str]:
        return [p.stem for p in self._notes_dir.glob("*.md")]

    # --- Conversation history (per-adapter, per-user) ---

    def append_message(
        self, adapter: str, user_id: str, role: str, text: str
    ) -> None:
        path = self._conversations_dir / f"{adapter}_{user_id}.jsonl"
        entry = {"ts": time.time(), "role": role, "text": text}
        with path.open("a") as f:
            f.write(json.dumps(entry) + "\n")

    def get_history(
        self, adapter: str, user_id: str, limit: int = 20
    ) -> list[dict[str, Any]]:
        path = self._conversations_dir / f"{adapter}_{user_id}.jsonl"
        if not path.exists():
            return []
        lines = path.read_text().strip().splitlines()
        entries = [json.loads(line) for line in lines[-limit:]]
        return entries

    # --- Summary context for the agent ---

    def context_summary(self, adapter: str, user_id: str) -> str:
        parts: list[str] = []
        facts = self.get_facts()
        if facts:
            facts_text = "\n".join(f"- {f['key']}: {f['value']}" for f in facts)
            parts.append(f"Known facts about the user:\n{facts_text}")
        history = self.get_history(adapter, user_id, limit=10)
        if history:
            hist_text = "\n".join(
                f"[{h['role']}] {h['text']}" for h in history
            )
            parts.append(f"Recent conversation:\n{hist_text}")
        return "\n\n".join(parts) if parts else "(no prior context)"
