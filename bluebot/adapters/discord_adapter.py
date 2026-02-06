"""Discord adapter — run BlueBot as a Discord bot."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from bluebot.adapters.base import Adapter, MessageHandler

if TYPE_CHECKING:
    pass

log = logging.getLogger(__name__)


class DiscordAdapter(Adapter):
    """Connects to Discord using discord.py."""

    def __init__(self, token: str) -> None:
        self._token = token
        self._client: object | None = None

    @property
    def name(self) -> str:
        return "discord"

    async def start(self, handler: MessageHandler) -> None:
        try:
            import discord
        except ImportError:
            log.error(
                "discord.py is not installed. "
                "Install it with: pip install bluebot[discord]"
            )
            return

        intents = discord.Intents.default()
        intents.message_content = True
        client = discord.Client(intents=intents)
        self._client = client

        @client.event
        async def on_ready() -> None:
            log.info("Discord bot connected as %s", client.user)

        @client.event
        async def on_message(message: discord.Message) -> None:
            if message.author == client.user:
                return
            # Respond to DMs or mentions
            is_dm = isinstance(message.channel, discord.DMChannel)
            is_mention = client.user in message.mentions if client.user else False
            if not (is_dm or is_mention):
                return
            text = message.content
            # Strip the mention prefix if present
            if client.user:
                text = text.replace(f"<@{client.user.id}>", "").strip()
            user_id = str(message.author.id)
            reply = await handler(self.name, user_id, text)
            # Discord has a 2000-char limit
            for i in range(0, len(reply), 2000):
                await message.reply(reply[i : i + 2000])

        await client.start(self._token)

    async def stop(self) -> None:
        if self._client is not None:
            import discord

            if isinstance(self._client, discord.Client):
                await self._client.close()

    async def send(self, user_id: str, text: str) -> None:
        if self._client is None:
            return
        import discord

        if not isinstance(self._client, discord.Client):
            return
        try:
            user = await self._client.fetch_user(int(user_id))
            await user.send(text)
        except Exception:
            log.exception("Failed to send DM to %s", user_id)
