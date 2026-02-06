"""Interactive CLI adapter — chat with BlueBot in your terminal."""

from __future__ import annotations

import asyncio
import sys

from rich.console import Console
from rich.markdown import Markdown

from bluebot.adapters.base import Adapter, MessageHandler

console = Console()


class CLIAdapter(Adapter):
    """Terminal-based chat interface using Rich for formatting."""

    def __init__(self) -> None:
        self._running = False

    @property
    def name(self) -> str:
        return "cli"

    async def start(self, handler: MessageHandler) -> None:
        self._running = True
        console.print(
            "[bold blue]BlueBot[/] is ready.  Type your message "
            "(or [bold]quit[/] to exit).\n"
        )
        loop = asyncio.get_event_loop()
        while self._running:
            try:
                user_input = await loop.run_in_executor(
                    None, self._read_input
                )
            except (EOFError, KeyboardInterrupt):
                break
            if user_input is None:
                break
            text = user_input.strip()
            if not text:
                continue
            if text.lower() in ("quit", "exit", "/quit", "/exit"):
                console.print("[dim]Goodbye![/]")
                break

            reply = await handler(self.name, "cli_user", text)
            console.print()
            console.print(Markdown(reply))
            console.print()

    async def stop(self) -> None:
        self._running = False

    async def send(self, user_id: str, text: str) -> None:
        console.print(f"\n[bold yellow]Reminder:[/] {text}\n")

    @staticmethod
    def _read_input() -> str | None:
        try:
            return input("you> ")
        except EOFError:
            return None
