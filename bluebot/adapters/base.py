"""Abstract base class for messaging adapters."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Callable, Awaitable

if TYPE_CHECKING:
    pass

# Callback signature: async (adapter_name, user_id, text) -> reply_text
MessageHandler = Callable[[str, str, str], Awaitable[str]]


class Adapter(ABC):
    """A messaging adapter connects BlueBot to a single chat platform."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique adapter name, e.g. 'cli', 'discord'."""

    @abstractmethod
    async def start(self, handler: MessageHandler) -> None:
        """Start listening for messages.  Call *handler* for each one."""

    @abstractmethod
    async def stop(self) -> None:
        """Gracefully shut down."""

    async def send(self, user_id: str, text: str) -> None:
        """Proactively send a message to a user (for reminders, etc.)."""
