"""Telegram adapter — run BlueBot as a Telegram bot."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from bluebot.adapters.base import Adapter, MessageHandler

if TYPE_CHECKING:
    pass

log = logging.getLogger(__name__)


class TelegramAdapter(Adapter):
    """Connects to Telegram using python-telegram-bot."""

    def __init__(self, token: str) -> None:
        self._token = token
        self._app: object | None = None
        self._handler: MessageHandler | None = None

    @property
    def name(self) -> str:
        return "telegram"

    async def start(self, handler: MessageHandler) -> None:
        try:
            from telegram import Update
            from telegram.ext import (
                ApplicationBuilder,
                ContextTypes,
                MessageHandler as TGMessageHandler,
                filters,
            )
        except ImportError:
            log.error(
                "python-telegram-bot is not installed. "
                "Install it with: pip install bluebot[telegram]"
            )
            return

        self._handler = handler

        app = ApplicationBuilder().token(self._token).build()

        async def on_message(
            update: Update, context: ContextTypes.DEFAULT_TYPE
        ) -> None:
            if update.message is None or update.message.text is None:
                return
            user_id = str(update.message.from_user.id) if update.message.from_user else "unknown"
            text = update.message.text
            reply = await handler(self.name, user_id, text)
            await update.message.reply_text(reply)

        app.add_handler(TGMessageHandler(filters.TEXT & ~filters.COMMAND, on_message))

        self._app = app
        log.info("Telegram bot starting...")
        await app.initialize()
        await app.start()
        await app.updater.start_polling()  # type: ignore[union-attr]

    async def stop(self) -> None:
        if self._app is not None:
            from telegram.ext import Application

            if isinstance(self._app, Application):
                await self._app.updater.stop()  # type: ignore[union-attr]
                await self._app.stop()
                await self._app.shutdown()

    async def send(self, user_id: str, text: str) -> None:
        if self._app is None:
            return
        try:
            from telegram.ext import Application

            if isinstance(self._app, Application):
                await self._app.bot.send_message(chat_id=int(user_id), text=text)
        except Exception:
            log.exception("Failed to send message to Telegram user %s", user_id)
