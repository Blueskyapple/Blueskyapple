# BlueBot

A self-hosted personal AI assistant with messaging platform integration and persistent memory. Inspired by [OpenClaw](https://github.com/clawdbot/clawdbot).

## Features

- **Multi-platform** — Chat via CLI, Discord, or Telegram (extensible to more)
- **Persistent memory** — Remembers facts, notes, and conversation history across sessions
- **Skill system** — Pluggable skills: notes, reminders, shell commands, and easy to add your own
- **Any LLM** — Works with Anthropic (Claude) or OpenAI (GPT) APIs
- **Privacy-first** — Self-hosted, your data stays on your machine
- **Easy install** — One command to set up

## Quick Start

### One-line install

```bash
curl -sSL https://raw.githubusercontent.com/Blueskyapple/Blueskyapple/main/install.sh | bash
```

### Manual install

```bash
git clone https://github.com/Blueskyapple/Blueskyapple.git
cd Blueskyapple
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[all]"
cp .env.example .env
# Edit .env and add your API key
bluebot
```

### Minimal install (CLI + Anthropic only)

```bash
pip install -e .
```

### With Discord or Telegram

```bash
pip install -e ".[discord]"    # Discord support
pip install -e ".[telegram]"   # Telegram support
pip install -e ".[all]"        # Everything
```

## Configuration

Copy `.env.example` to `.env` and fill in your settings:

```bash
cp .env.example .env
```

Key settings:

| Variable | Description | Default |
|---|---|---|
| `BLUEBOT_LLM_PROVIDER` | `anthropic` or `openai` | `anthropic` |
| `ANTHROPIC_API_KEY` | Your Anthropic API key | — |
| `OPENAI_API_KEY` | Your OpenAI API key | — |
| `DISCORD_BOT_TOKEN` | Discord bot token (optional) | — |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token (optional) | — |
| `BLUEBOT_ENABLE_SHELL` | Allow shell command execution | `false` |
| `BLUEBOT_MEMORY_DIR` | Where to store memory | `~/.bluebot/memory` |

## Usage

```
$ bluebot

  ____  _            ____        _
 | __ )| |_   _  ___| __ )  ___ | |_
 |  _ \| | | | |/ _ \  _ \ / _ \| __|
 | |_) | | |_| |  __/ |_) | (_) | |_
 |____/|_|\__,_|\___|____/ \___/ \__|

  Your personal AI assistant

BlueBot is ready. Type your message (or quit to exit).

you> Remember that my favorite language is Python
Remembered: favorite_language = Python

you> Set a reminder to check the build in 30 minutes
Reminder set: 'check the build' in 30 minute(s).

you> What notes do I have saved?
No notes saved yet.
```

## Built-in Skills

| Skill | Description |
|---|---|
| `remember` | Store facts about the user |
| `forget` | Remove a stored fact |
| `save_note` | Save a longer note by topic |
| `read_note` | Read a saved note |
| `list_notes` | List all note topics |
| `reminder` | Set or list time-based reminders |
| `shell` | Run shell commands (opt-in via config) |

## Adding Custom Skills

Create a new file in `bluebot/skills/`:

```python
from bluebot.skills.base import Skill

class MySkill(Skill):
    @property
    def name(self) -> str:
        return "my_skill"

    @property
    def description(self) -> str:
        return "Does something useful."

    @property
    def args_schema(self):
        return {"input": "string"}

    def run(self, **kwargs):
        return f"Result: {kwargs.get('input')}"
```

Then register it in `bluebot/gateway.py`:

```python
from bluebot.skills.my_skill import MySkill
self.agent.register_skill(MySkill())
```

## Architecture

```
User Message
    |
    v
[Adapter]  (CLI / Discord / Telegram)
    |
    v
[Gateway]  (routes messages, runs background tasks)
    |
    v
[Agent]    (builds prompt with memory context, calls LLM)
    |
    v
[LLM API]  (Anthropic / OpenAI)
    |
    v
[Skills]   (executed if LLM requests a tool call)
    |
    v
Reply sent back through Adapter
```

## Project Structure

```
bluebot/
  __init__.py          # Package metadata
  __main__.py          # CLI entry point
  config.py            # Configuration from .env
  memory.py            # Persistent file-based memory
  agent.py             # LLM agent with skill execution
  gateway.py           # Central daemon
  adapters/
    base.py            # Adapter interface
    cli.py             # Terminal chat
    discord_adapter.py # Discord integration
    telegram_adapter.py# Telegram integration
  skills/
    base.py            # Skill interface
    shell.py           # Shell command execution
    notes.py           # Notes & facts management
    reminder.py        # Time-based reminders
```

## Requirements

- Python 3.10+
- An API key from [Anthropic](https://console.anthropic.com/) or [OpenAI](https://platform.openai.com/)

## License

MIT
