"""Tests for built-in skills."""

from pathlib import Path

import pytest

from bluebot.memory import Memory
from bluebot.skills.notes import (
    ForgetFactSkill,
    ListNotesSkill,
    ReadNoteSkill,
    RememberFactSkill,
    SaveNoteSkill,
)
from bluebot.skills.reminder import ReminderSkill


@pytest.fixture
def mem(tmp_path: Path) -> Memory:
    return Memory(tmp_path / "memory")


class TestNoteSkills:
    def test_remember_and_forget(self, mem: Memory) -> None:
        remember = RememberFactSkill(mem)
        forget = ForgetFactSkill(mem)

        result = remember.run(key="color", value="blue")
        assert "Remembered" in result

        result = forget.run(key="color")
        assert "Forgot" in result

        result = forget.run(key="color")
        assert "No fact found" in result

    def test_remember_missing_args(self, mem: Memory) -> None:
        skill = RememberFactSkill(mem)
        assert "Error" in skill.run(key="", value="")

    def test_save_read_list_notes(self, mem: Memory) -> None:
        save = SaveNoteSkill(mem)
        read = ReadNoteSkill(mem)
        list_notes = ListNotesSkill(mem)

        result = save.run(topic="todo", content="Buy milk")
        assert "saved" in result.lower()

        result = read.run(topic="todo")
        assert result == "Buy milk"

        result = list_notes.run()
        assert "todo" in result

    def test_read_missing_note(self, mem: Memory) -> None:
        skill = ReadNoteSkill(mem)
        assert "No note found" in skill.run(topic="nothing")


class TestReminderSkill:
    def test_set_and_list(self, tmp_path: Path) -> None:
        skill = ReminderSkill(tmp_path)
        result = skill.run(action="set", message="test", delay_minutes=5)
        assert "Reminder set" in result

        result = skill.run(action="list")
        assert "test" in result

    def test_set_missing_message(self, tmp_path: Path) -> None:
        skill = ReminderSkill(tmp_path)
        assert "Error" in skill.run(action="set", message="", delay_minutes=5)

    def test_set_bad_delay(self, tmp_path: Path) -> None:
        skill = ReminderSkill(tmp_path)
        assert "Error" in skill.run(action="set", message="x", delay_minutes=0)

    def test_check_due(self, tmp_path: Path) -> None:
        skill = ReminderSkill(tmp_path)
        # Set a reminder with negative delay so it's immediately due
        skill.run(action="set", message="overdue", delay_minutes=0.001)
        import time
        time.sleep(0.1)
        due = skill.check_due()
        assert "overdue" in due

    def test_list_empty(self, tmp_path: Path) -> None:
        skill = ReminderSkill(tmp_path)
        assert "No pending" in skill.run(action="list")
