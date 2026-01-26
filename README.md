# BlueBot

**Your Personal AI Assistant** - Multi-channel, local-first, easy to use.

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

BlueBot is an open-source personal AI assistant that connects to your favorite messaging platforms. Inspired by [ClawdBot](https://github.com/clawdbot/clawdbot), it provides a simple, extensible framework for building AI-powered bots.

## Features

- **Multi-Channel Support** - Discord, Telegram, Slack, and WebChat out of the box
- **Local-First Storage** - Your data stored as Markdown files (like Obsidian)
- **Extensible Skills** - Plugin system for adding new capabilities
- **Multiple AI Providers** - OpenAI, Anthropic, Ollama, and any OpenAI-compatible API
- **Easy Setup** - Interactive wizard gets you running in minutes
- **REST & WebSocket API** - Full HTTP/WS gateway for custom integrations
- **Type-Safe** - Written in TypeScript with full type definitions

## Quick Start

### Installation

```bash
# Install globally
npm install -g bluebot

# Or clone and build
git clone https://github.com/Blueskyapple/Blueskyapple.git
cd Blueskyapple
npm install
npm run build
```

### Setup

```bash
# Run the interactive setup wizard
bluebot setup

# Or generate a sample config file
bluebot config --generate
```

### Start

```bash
# Set your API key
export OPENAI_API_KEY=your-key-here

# Start the bot
bluebot start
```

### Interactive Chat

```bash
# Start a CLI chat session
bluebot chat
```

## Configuration

BlueBot uses YAML configuration. Here's an example `bluebot.yaml`:

```yaml
name: BlueBot
version: 1.0.0

gateway:
  host: 127.0.0.1
  port: 18800
  cors: true

ai:
  provider: openai
  model: gpt-4o-mini
  temperature: 0.7
  systemPrompt: |
    You are BlueBot, a helpful personal AI assistant.

channels:
  - id: discord-main
    type: discord
    name: Discord Bot
    enabled: true
    config:
      token: your-discord-bot-token
      prefix: "!bot"
      respondToDMs: true
      respondToMentions: true

  - id: telegram-main
    type: telegram
    name: Telegram Bot
    enabled: true
    config:
      token: your-telegram-bot-token
      respondToGroups: true

skills:
  - weather
  - calculator
  - reminder
  - system-info
  - web-search
  - notes

storage:
  type: local
  path: .bluebot
```

## CLI Commands

```bash
bluebot start      # Start the bot
bluebot setup      # Run setup wizard
bluebot chat       # Interactive chat
bluebot status     # Check if bot is running
bluebot skills     # Manage skills
bluebot channels   # Manage channels
bluebot config     # View/edit configuration
bluebot info       # Show version info
```

## API Usage

### REST API

```bash
# Chat endpoint
curl -X POST http://localhost:18800/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "userId": "user123"}'

# Streaming endpoint
curl -X POST http://localhost:18800/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me a story"}'

# Health check
curl http://localhost:18800/health

# List sessions
curl http://localhost:18800/sessions
```

### WebSocket

```javascript
const ws = new WebSocket('ws://localhost:18800');

ws.onopen = () => {
  // Send a message
  ws.send(JSON.stringify({
    type: 'message',
    payload: {
      content: 'Hello BlueBot!',
      userId: 'user123'
    }
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Response:', data);
};
```

### Programmatic Usage

```typescript
import { BlueBot } from 'bluebot';

// Create from config file
const bot = await BlueBot.fromConfig('./bluebot.yaml');

// Start the bot
await bot.start();

// Simple chat
const response = await bot.chat('Hello!', 'user123');
console.log(response);

// Access components
const agent = bot.getAgent();
const sessions = bot.getSessionManager();
const skills = bot.getSkillManager();

// Stop the bot
await bot.stop();
```

## Channel Setup

### Discord

1. Create a bot at [Discord Developer Portal](https://discord.com/developers/applications)
2. Enable "Message Content Intent" in Bot settings
3. Copy the bot token
4. Add to your config or run `bluebot channels --add discord`

### Telegram

1. Talk to [@BotFather](https://t.me/BotFather) on Telegram
2. Create a new bot with `/newbot`
3. Copy the token
4. Add to your config or run `bluebot channels --add telegram`

### Slack

1. Create an app at [Slack API](https://api.slack.com/apps)
2. Add Bot Token Scopes: `chat:write`, `im:history`, `im:write`
3. Install to workspace and copy the Bot Token (xoxb-...)
4. Add to your config or run `bluebot channels --add slack`

## Skills

BlueBot comes with built-in skills:

| Skill | Description | Triggers |
|-------|-------------|----------|
| `weather` | Get weather information | "weather", `/weather` |
| `calculator` | Math calculations | `/calc`, math expressions |
| `reminder` | Set reminders | "remind me", `/remind` |
| `system-info` | System information | `/system` |
| `web-search` | Web search | `/search`, "search for" |
| `notes` | Take notes | `/note`, "take a note" |

### Managing Skills

```bash
# List skills
bluebot skills --list

# Enable a skill
bluebot skills --enable weather

# Disable a skill
bluebot skills --disable calculator

# Get skill info
bluebot skills --info weather
```

### Creating Custom Skills

```typescript
import { createSkill, createTool } from 'bluebot';

const mySkill = createSkill({
  id: 'my-skill',
  name: 'My Custom Skill',
  description: 'Does something cool',
  version: '1.0.0',
  enabled: true,
  triggers: [
    { type: 'command', pattern: '/mycommand' },
    { type: 'keyword', pattern: 'do something' }
  ],
  tools: [
    createTool({
      name: 'my_tool',
      description: 'Performs an action',
      parameters: {
        type: 'object',
        properties: {
          input: {
            type: 'string',
            description: 'The input value'
          }
        },
        required: ['input']
      },
      handler: async (params) => {
        return { result: `Processed: ${params.input}` };
      }
    })
  ],
  handler: async (context, params) => {
    return {
      success: true,
      response: 'Skill activated!'
    };
  }
});
```

## Storage

BlueBot stores data locally as Markdown files:

```
.bluebot/
  ├── memory/           # Conversation history
  │   ├── telegram:123.md
  │   └── discord:456.md
  └── data/             # General data storage
      └── settings.json
```

Memory files are human-readable Markdown:

```markdown
# Conversation: telegram:123

Created: 2024-01-01T12:00:00.000Z
Messages: 5

---

## User (John)
*1/1/2024, 12:00:00 PM*

Hello!

## Assistant
*1/1/2024, 12:00:01 PM*

Hello! How can I help you today?
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `BLUEBOT_AI_PROVIDER` | AI provider override |
| `BLUEBOT_AI_MODEL` | Model override |
| `BLUEBOT_PORT` | Gateway port override |
| `BLUEBOT_HOST` | Gateway host override |

## Project Structure

```
src/
  ├── core/             # Core types, events, agent
  │   ├── types.ts
  │   ├── events.ts
  │   ├── agent.ts
  │   └── session.ts
  ├── gateway/          # HTTP/WebSocket server
  │   └── server.ts
  ├── channels/         # Channel adapters
  │   ├── base.ts
  │   ├── discord.ts
  │   ├── telegram.ts
  │   └── slack.ts
  ├── skills/           # Skill system
  │   ├── manager.ts
  │   └── builtin/
  ├── storage/          # Local storage
  │   └── local.ts
  ├── config/           # Configuration
  │   └── index.ts
  ├── cli/              # CLI commands
  │   └── commands/
  └── index.ts          # Main exports
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Lint
npm run lint
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Inspired by [ClawdBot](https://github.com/clawdbot/clawdbot)
- Built with [OpenAI](https://openai.com/), [Discord.js](https://discord.js.org/), [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)

---

**Sources:**
- [ClawdBot GitHub](https://github.com/clawdbot/clawdbot)
- [ClawdBot Documentation](https://docs.clawd.bot)
- [ClawdBot on Medium](https://medium.com/@gemQueenx/clawdbot-ai-the-revolutionary-open-source-personal-assistant-transforming-productivity-in-2026-6ec5fdb3084f)
