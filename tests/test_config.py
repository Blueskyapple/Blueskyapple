"""Tests for configuration loading."""

import os
from unittest.mock import patch

from bluebot.config import Config, load_config


class TestConfig:
    def test_defaults(self) -> None:
        with patch.dict(os.environ, {}, clear=True):
            config = Config()
            assert config.llm_provider == "anthropic"
            assert config.resolved_model == "claude-sonnet-4-20250514"
            assert config.enable_shell is False
            assert "cli" in config.enabled_adapters

    def test_openai_provider(self) -> None:
        config = Config(llm_provider="openai", openai_api_key="sk-test")
        assert config.api_key == "sk-test"
        assert config.resolved_model == "gpt-4o"

    def test_custom_model(self) -> None:
        config = Config(model="custom-model")
        assert config.resolved_model == "custom-model"

    def test_discord_adapter_enabled(self) -> None:
        config = Config(discord_bot_token="token123")
        assert "discord" in config.enabled_adapters

    def test_telegram_adapter_enabled(self) -> None:
        config = Config(telegram_bot_token="token456")
        assert "telegram" in config.enabled_adapters

    def test_load_config_from_env(self) -> None:
        env = {
            "BLUEBOT_LLM_PROVIDER": "openai",
            "OPENAI_API_KEY": "sk-env",
            "BLUEBOT_LOG_LEVEL": "DEBUG",
        }
        with patch.dict(os.environ, env, clear=False):
            config = load_config()
            assert config.llm_provider == "openai"
            assert config.log_level == "DEBUG"
