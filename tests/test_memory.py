"""Tests for the persistent memory system."""

from pathlib import Path

import pytest

from bluebot.memory import Memory


@pytest.fixture
def mem(tmp_path: Path) -> Memory:
    return Memory(tmp_path / "memory")


class TestFacts:
    def test_add_and_get(self, mem: Memory) -> None:
        mem.add_fact("name", "Alice")
        facts = mem.get_facts()
        assert len(facts) == 1
        assert facts[0] == {"key": "name", "value": "Alice"}

    def test_upsert(self, mem: Memory) -> None:
        mem.add_fact("name", "Alice")
        mem.add_fact("name", "Bob")
        facts = mem.get_facts()
        assert len(facts) == 1
        assert facts[0]["value"] == "Bob"

    def test_remove(self, mem: Memory) -> None:
        mem.add_fact("name", "Alice")
        assert mem.remove_fact("name") is True
        assert mem.get_facts() == []

    def test_remove_missing(self, mem: Memory) -> None:
        assert mem.remove_fact("nonexistent") is False


class TestNotes:
    def test_save_and_read(self, mem: Memory) -> None:
        mem.save_note("project", "Build something cool")
        assert mem.get_note("project") == "Build something cool"

    def test_read_missing(self, mem: Memory) -> None:
        assert mem.get_note("nope") is None

    def test_list_notes(self, mem: Memory) -> None:
        mem.save_note("alpha", "A")
        mem.save_note("beta", "B")
        topics = mem.list_notes()
        assert set(topics) == {"alpha", "beta"}


class TestConversations:
    def test_append_and_get(self, mem: Memory) -> None:
        mem.append_message("cli", "user1", "user", "Hello")
        mem.append_message("cli", "user1", "assistant", "Hi there")
        history = mem.get_history("cli", "user1")
        assert len(history) == 2
        assert history[0]["role"] == "user"
        assert history[1]["text"] == "Hi there"

    def test_history_limit(self, mem: Memory) -> None:
        for i in range(30):
            mem.append_message("cli", "user1", "user", f"msg {i}")
        history = mem.get_history("cli", "user1", limit=5)
        assert len(history) == 5
        assert history[0]["text"] == "msg 25"

    def test_empty_history(self, mem: Memory) -> None:
        assert mem.get_history("cli", "nobody") == []

    def test_context_summary_empty(self, mem: Memory) -> None:
        summary = mem.context_summary("cli", "nobody")
        assert summary == "(no prior context)"

    def test_context_summary_with_data(self, mem: Memory) -> None:
        mem.add_fact("lang", "Python")
        mem.append_message("cli", "u1", "user", "Hi")
        summary = mem.context_summary("cli", "u1")
        assert "lang: Python" in summary
        assert "[user] Hi" in summary
