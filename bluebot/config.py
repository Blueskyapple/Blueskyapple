"""Configuration management — loads from .env and environment variables."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from pydantic import BaseModel, Field

# Load .env file from CWD or project root
load_dotenv()


def _env(key: str, default: str = "") -> str:
    return os.environ.get(key, default)


class Config(BaseModel):
    """Central configuration for BlueBot."""

    # LLM
    llm_provider: Literal["anthropic", "openai"] = Field(
        default_factory=lambda: _env("BLUEBOT_LLM_PROVIDER", "anthropic")
    )
    anthropic_api_key: str = Field(
        default_factory=lambda: _env("ANTHROPIC_API_KEY")
    )
    openai_api_key: str = Field(
        default_factory=lambda: _env("OPENAI_API_KEY")
    )
    model: str = Field(
        default_factory=lambda: _env("BLUEBOT_MODEL", "")
    )

    # Adapters
    discord_bot_token: str = Field(
        default_factory=lambda: _env("DISCORD_BOT_TOKEN")
    )
    telegram_bot_token: str = Field(
        default_factory=lambda: _env("TELEGRAM_BOT_TOKEN")
    )

    # Memory
    memory_dir: Path = Field(
        default_factory=lambda: Path(
            _env("BLUEBOT_MEMORY_DIR", str(Path.home() / ".bluebot" / "memory"))
        )
    )

    # Skills
    enable_shell: bool = Field(
        default_factory=lambda: _env("BLUEBOT_ENABLE_SHELL", "false").lower()
        in ("true", "1", "yes")
    )

    # Gateway
    log_level: str = Field(
        default_factory=lambda: _env("BLUEBOT_LOG_LEVEL", "INFO")
    )

    @property
    def api_key(self) -> str:
        if self.llm_provider == "anthropic":
            return self.anthropic_api_key
        return self.openai_api_key

    @property
    def resolved_model(self) -> str:
        if self.model:
            return self.model
        if self.llm_provider == "anthropic":
            return "claude-sonnet-4-20250514"
        return "gpt-4o"

    @property
    def enabled_adapters(self) -> list[str]:
        adapters = ["cli"]
        if self.discord_bot_token:
            adapters.append("discord")
        if self.telegram_bot_token:
            adapters.append("telegram")
        return adapters


def load_config() -> Config:
    """Create a Config instance from environment."""
    return Config()
