"""LLM Agent — sends messages to the configured provider and executes skills."""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

import httpx

if TYPE_CHECKING:
    from bluebot.config import Config
    from bluebot.memory import Memory
    from bluebot.skills.base import Skill

log = logging.getLogger(__name__)

SYSTEM_PROMPT = """\
You are BlueBot, a helpful personal AI assistant.
You have access to the user's persistent memory and a set of skills.
Be concise and helpful.  When a skill can answer better than plain text,
use it by returning a JSON tool call.

Available skills:
{skill_descriptions}

User context:
{user_context}

To invoke a skill, respond with EXACTLY this JSON (no other text):
{{"tool": "<skill_name>", "args": {{...}}}}

If no skill is needed, just respond in plain text.
"""


@dataclass
class Agent:
    """Coordinates LLM calls and skill execution."""

    config: "Config"
    memory: "Memory"
    skills: dict[str, "Skill"] = field(default_factory=dict)

    def register_skill(self, skill: "Skill") -> None:
        self.skills[skill.name] = skill

    def _skill_descriptions(self) -> str:
        if not self.skills:
            return "(none)"
        lines = []
        for s in self.skills.values():
            args_desc = json.dumps(s.args_schema) if s.args_schema else "{}"
            lines.append(f"- {s.name}: {s.description}  args={args_desc}")
        return "\n".join(lines)

    def _build_messages(
        self, adapter: str, user_id: str, user_text: str
    ) -> list[dict[str, str]]:
        context = self.memory.context_summary(adapter, user_id)
        system = SYSTEM_PROMPT.format(
            skill_descriptions=self._skill_descriptions(),
            user_context=context,
        )
        return [
            {"role": "system", "content": system},
            {"role": "user", "content": user_text},
        ]

    async def chat(
        self, adapter: str, user_id: str, user_text: str
    ) -> str:
        """Process a user message and return the assistant's reply."""
        self.memory.append_message(adapter, user_id, "user", user_text)

        messages = self._build_messages(adapter, user_id, user_text)
        raw_reply = await self._call_llm(messages)

        # Check if the LLM wants to invoke a skill
        reply = self._maybe_run_skill(raw_reply)

        self.memory.append_message(adapter, user_id, "assistant", reply)
        return reply

    def _maybe_run_skill(self, text: str) -> str:
        """If the LLM returned a tool-call JSON, execute it."""
        stripped = text.strip()
        if not (stripped.startswith("{") and stripped.endswith("}")):
            return text
        try:
            call = json.loads(stripped)
        except json.JSONDecodeError:
            return text
        if "tool" not in call:
            return text

        skill_name = call["tool"]
        args = call.get("args", {})
        skill = self.skills.get(skill_name)
        if skill is None:
            return f"Unknown skill: {skill_name}"
        try:
            log.info("Running skill %s with args %s", skill_name, args)
            return skill.run(**args)
        except Exception as exc:
            log.exception("Skill %s failed", skill_name)
            return f"Skill error: {exc}"

    # --- LLM provider calls ---

    async def _call_llm(self, messages: list[dict[str, str]]) -> str:
        if self.config.llm_provider == "anthropic":
            return await self._call_anthropic(messages)
        return await self._call_openai(messages)

    async def _call_anthropic(self, messages: list[dict[str, str]]) -> str:
        system_msg = ""
        user_msgs: list[dict[str, str]] = []
        for m in messages:
            if m["role"] == "system":
                system_msg = m["content"]
            else:
                user_msgs.append(m)

        payload: dict[str, Any] = {
            "model": self.config.resolved_model,
            "max_tokens": 4096,
            "messages": user_msgs,
        }
        if system_msg:
            payload["system"] = system_msg

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self.config.api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            # Extract text from content blocks
            blocks = data.get("content", [])
            parts = [b["text"] for b in blocks if b.get("type") == "text"]
            return "\n".join(parts) or "(empty response)"

    async def _call_openai(self, messages: list[dict[str, str]]) -> str:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.config.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.config.resolved_model,
                    "messages": messages,
                    "max_tokens": 4096,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
