"""Gateway — the central daemon that wires adapters, agent, and skills."""

from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING

from bluebot.adapters.base import Adapter
from bluebot.adapters.cli import CLIAdapter
from bluebot.agent import Agent
from bluebot.config import Config
from bluebot.memory import Memory
from bluebot.skills.notes import (
    ForgetFactSkill,
    ListNotesSkill,
    ReadNoteSkill,
    RememberFactSkill,
    SaveNoteSkill,
)
from bluebot.skills.reminder import ReminderSkill

if TYPE_CHECKING:
    pass

log = logging.getLogger(__name__)


class Gateway:
    """Runs the full BlueBot stack: adapters + agent + background tasks."""

    def __init__(self, config: Config) -> None:
        self.config = config
        self.memory = Memory(config.memory_dir)
        self.agent = Agent(config=config, memory=self.memory)
        self.adapters: list[Adapter] = []
        self._reminder_skill: ReminderSkill | None = None
        self._setup_skills()
        self._setup_adapters()

    def _setup_skills(self) -> None:
        # Memory skills
        self.agent.register_skill(RememberFactSkill(self.memory))
        self.agent.register_skill(ForgetFactSkill(self.memory))
        self.agent.register_skill(SaveNoteSkill(self.memory))
        self.agent.register_skill(ReadNoteSkill(self.memory))
        self.agent.register_skill(ListNotesSkill(self.memory))

        # Reminder
        reminder = ReminderSkill(self.config.memory_dir)
        self._reminder_skill = reminder
        self.agent.register_skill(reminder)

        # Shell (opt-in)
        if self.config.enable_shell:
            from bluebot.skills.shell import ShellSkill

            self.agent.register_skill(ShellSkill())
            log.info("Shell skill ENABLED — be careful!")

    def _setup_adapters(self) -> None:
        # CLI is always available
        self.adapters.append(CLIAdapter())

        if self.config.discord_bot_token:
            from bluebot.adapters.discord_adapter import DiscordAdapter

            self.adapters.append(DiscordAdapter(self.config.discord_bot_token))

        if self.config.telegram_bot_token:
            from bluebot.adapters.telegram_adapter import TelegramAdapter

            self.adapters.append(
                TelegramAdapter(self.config.telegram_bot_token)
            )

        names = [a.name for a in self.adapters]
        log.info("Adapters enabled: %s", ", ".join(names))

    async def _handle_message(
        self, adapter: str, user_id: str, text: str
    ) -> str:
        """Central message handler — called by every adapter."""
        log.info("[%s/%s] %s", adapter, user_id, text[:80])
        try:
            reply = await self.agent.chat(adapter, user_id, text)
        except Exception:
            log.exception("Agent error")
            reply = "Sorry, something went wrong. Please try again."
        return reply

    async def _reminder_loop(self) -> None:
        """Background loop that checks for due reminders every 15 seconds."""
        if self._reminder_skill is None:
            return
        while True:
            await asyncio.sleep(15)
            due = self._reminder_skill.check_due()
            for msg in due:
                text = f"Reminder: {msg}"
                for adapter in self.adapters:
                    try:
                        await adapter.send("cli_user", text)
                    except Exception:
                        log.exception("Failed to deliver reminder via %s", adapter.name)

    async def run(self) -> None:
        """Start all adapters and background tasks."""
        log.info("BlueBot Gateway starting...")

        # Start reminder background task
        reminder_task = asyncio.create_task(self._reminder_loop())

        # Start adapters — CLI runs in foreground, others in background
        background_adapters = [a for a in self.adapters if a.name != "cli"]
        cli_adapter = next((a for a in self.adapters if a.name == "cli"), None)

        bg_tasks = []
        for adapter in background_adapters:
            task = asyncio.create_task(adapter.start(self._handle_message))
            bg_tasks.append(task)

        try:
            if cli_adapter:
                await cli_adapter.start(self._handle_message)
            else:
                # No CLI — wait forever (serving Discord/Telegram)
                await asyncio.Event().wait()
        except (KeyboardInterrupt, asyncio.CancelledError):
            pass
        finally:
            log.info("Shutting down...")
            reminder_task.cancel()
            for task in bg_tasks:
                task.cancel()
            for adapter in self.adapters:
                await adapter.stop()
