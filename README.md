# OpenClaw AI Assistant

An open-source personal AI assistant that runs on your own devices. Multi-platform, extensible, and privacy-focused.

## Features

- **Multi-Platform Messaging** — WebChat UI, Telegram, Discord, Slack integration
- **Model-Agnostic** — Supports Anthropic Claude, OpenAI GPT, and local Ollama models
- **Persistent Memory** — Stores context as local Markdown files for deep personalization
- **Proactive Heartbeat** — Schedule recurring tasks and automated check-ins with cron expressions
- **Extensible Skills** — Built-in file system, shell, web browsing, and memory tools. Add custom skills via plugins
- **Privacy-First** — Everything runs locally. You bring your own API keys
- **Agentic Loop** — The AI can chain multiple tool calls autonomously to complete complex tasks

## Quick Start

```bash
# Clone and install
git clone https://github.com/Blueskyapple/Blueskyapple.git
cd Blueskyapple
npm install

# Configure your API key
cp .env.example .env
# Edit .env and add your API key

# Build
npm run build

# Start the server (Web UI at http://localhost:3000)
npm start -- start

# Or start an interactive CLI chat
npm start -- chat
```

## Architecture

```
src/
  core/           # Agent runtime, types, config, logger
    agent.ts      # Main agent with agentic loop (message → AI → tool calls → response)
    types.ts      # TypeScript type definitions
    config.ts     # Configuration loader (env + file)
    logger.ts     # Colored console logger
  providers/      # AI model providers (model-agnostic)
    base.ts       # Abstract AIProvider class
    anthropic.ts  # Anthropic Claude API
    openai.ts     # OpenAI GPT API
    ollama.ts     # Local Ollama models
  memory/         # Persistent memory system
    manager.ts    # Markdown-based local memory storage
  skills/         # Extensible skill/plugin system
    loader.ts     # Skill discovery and loading
    builtin/
      memory.ts   # Memory store/search/list/delete tools
      filesystem.ts # File read/write/list/mkdir/delete tools
      shell.ts    # Shell command execution (with safety checks)
      webbrowse.ts  # Web page fetching and content extraction
  channels/       # Messaging platform adapters
    webchat.ts    # WebSocket-based web chat
    telegram.ts   # Telegram Bot API (long polling)
    discord.ts    # Discord bot adapter
    slack.ts      # Slack bot adapter
  heartbeat/      # Proactive task scheduler
    scheduler.ts  # Cron-based recurring task execution
  web/
    public/
      index.html  # WebChat UI (dark theme, real-time WebSocket)
  index.ts        # Main OpenClaw application class
  cli.ts          # CLI entry point (start, chat, config, skills commands)
```

## Configuration

Configuration is loaded from environment variables (`.env`) and/or `config/default.json`.

| Variable | Description | Default |
|---|---|---|
| `AI_PROVIDER` | AI provider: `anthropic`, `openai`, `ollama` | `anthropic` |
| `AI_MODEL` | Model name | `claude-sonnet-4-20250514` |
| `ANTHROPIC_API_KEY` | Anthropic API key | — |
| `OPENAI_API_KEY` | OpenAI API key | — |
| `OLLAMA_BASE_URL` | Ollama server URL | `http://localhost:11434` |
| `WEB_PORT` | Web UI port | `3000` |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | — |
| `DISCORD_BOT_TOKEN` | Discord bot token | — |
| `SLACK_BOT_TOKEN` | Slack bot token | — |
| `HEARTBEAT_INTERVAL` | Default heartbeat interval (minutes) | `15` |
| `MEMORY_PATH` | Memory storage directory | `./data/memory` |
| `SANDBOX_MODE` | Execution sandbox: `none`, `restricted`, `docker` | `restricted` |

## CLI Commands

```bash
openclaw start              # Start the full server with Web UI
openclaw start -p 8080      # Start on a custom port
openclaw chat               # Interactive CLI chat
openclaw config             # Show current configuration
openclaw skills             # List available skills
```

## Built-in Skills

| Skill | Tools | Description |
|---|---|---|
| **memory** | `memory_store`, `memory_search`, `memory_list`, `memory_delete` | Persistent memory management |
| **filesystem** | `fs_read`, `fs_write`, `fs_list`, `fs_mkdir`, `fs_delete`, `fs_exists` | Local file operations |
| **shell** | `shell_exec` | Shell command execution with safety checks |
| **webbrowse** | `web_fetch`, `web_search_summary` | Web content fetching |

## Custom Skills

Create a directory in `data/skills/` with a `manifest.json`:

```json
{
  "name": "my-skill",
  "description": "My custom skill",
  "version": "1.0.0",
  "main": "index.js"
}
```

The skill module should export an object implementing the `Skill` interface with `name`, `description`, `version`, `tools`, and `execute()`.

## Heartbeat (Proactive Tasks)

The heartbeat system allows you to schedule recurring AI tasks using cron expressions. Tasks are persisted to disk and survive restarts.

## Testing

```bash
npm test
```

## License

MIT
