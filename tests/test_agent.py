"""Tests for the Agent — skill dispatch logic (no real LLM calls)."""

from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest

from bluebot.agent import Agent
from bluebot.config import Config
from bluebot.memory import Memory
from bluebot.skills.base import Skill


class EchoSkill(Skill):
    @property
    def name(self) -> str:
        return "echo"

    @property
    def description(self) -> str:
        return "Echoes input."

    @property
    def args_schema(self) -> dict[str, Any]:
        return {"text": "string"}

    def run(self, **kwargs: Any) -> str:
        return f"echo: {kwargs.get('text', '')}"


@pytest.fixture
def agent(tmp_path: Path) -> Agent:
    config = Config(
        llm_provider="anthropic",
        anthropic_api_key="test-key",
        memory_dir=tmp_path / "mem",
    )
    memory = Memory(config.memory_dir)
    a = Agent(config=config, memory=memory)
    a.register_skill(EchoSkill())
    return a


class TestSkillDispatch:
    def test_plain_text_passthrough(self, agent: Agent) -> None:
        result = agent._maybe_run_skill("Hello, how are you?")
        assert result == "Hello, how are you?"

    def test_json_tool_call(self, agent: Agent) -> None:
        result = agent._maybe_run_skill('{"tool": "echo", "args": {"text": "hi"}}')
        assert result == "echo: hi"

    def test_unknown_skill(self, agent: Agent) -> None:
        result = agent._maybe_run_skill('{"tool": "unknown", "args": {}}')
        assert "Unknown skill" in result

    def test_invalid_json(self, agent: Agent) -> None:
        result = agent._maybe_run_skill("{not valid json}")
        assert result == "{not valid json}"

    def test_json_without_tool_key(self, agent: Agent) -> None:
        result = agent._maybe_run_skill('{"key": "value"}')
        assert result == '{"key": "value"}'


class TestChat:
    @pytest.mark.asyncio
    async def test_chat_calls_llm(self, agent: Agent) -> None:
        with patch.object(agent, "_call_llm", new_callable=AsyncMock) as mock:
            mock.return_value = "Hello!"
            reply = await agent.chat("cli", "user1", "Hi")
            assert reply == "Hello!"
            mock.assert_called_once()

    @pytest.mark.asyncio
    async def test_chat_runs_skill_from_llm(self, agent: Agent) -> None:
        with patch.object(agent, "_call_llm", new_callable=AsyncMock) as mock:
            mock.return_value = '{"tool": "echo", "args": {"text": "world"}}'
            reply = await agent.chat("cli", "user1", "echo world")
            assert reply == "echo: world"

    @pytest.mark.asyncio
    async def test_chat_stores_history(self, agent: Agent) -> None:
        with patch.object(agent, "_call_llm", new_callable=AsyncMock) as mock:
            mock.return_value = "Sure thing"
            await agent.chat("cli", "user1", "test")
            history = agent.memory.get_history("cli", "user1")
            assert len(history) == 2
            assert history[0]["role"] == "user"
            assert history[1]["role"] == "assistant"
