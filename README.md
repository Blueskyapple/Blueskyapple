# code-assistant

A Claude Code-style AI coding agent for the terminal, powered by Anthropic's Claude API.

## Features

- **Interactive REPL** with persistent history and auto-suggestions
- **Agentic tool loop** – the model can call tools repeatedly until the task is complete
- **File tools**: read, write, and patch files with exact string replacement
- **Bash execution**: run tests, linters, git commands, builds – anything in a shell
- **File search**: recursive grep with regex support
- **Directory listing**: tree view of your project
- **Rich terminal UI**: syntax-highlighted output, Markdown rendering, colour-coded tool events
- **Conversation memory**: full multi-turn context until you type `/clear`

## Installation

```bash
# 1. Clone the repo
git clone <repo-url>
cd <repo>

# 2. Install dependencies (Python 3.11+)
pip install -r requirements.txt

# 3. (Optional) install as a CLI tool
pip install -e .
```

## Usage

```bash
# Set your API key
export ANTHROPIC_API_KEY=sk-ant-...

# Run interactively
python -m code_assistant

# Or after pip install -e .
code-assistant

# Pass an initial prompt directly
python -m code_assistant "explain the structure of this project"

# Use a specific model or working directory
python -m code_assistant --model claude-sonnet-4-6 --cwd /path/to/project
```

## Slash Commands

| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/clear` | Clear conversation history |
| `/cwd [path]` | Change the working directory |
| `/model [name]` | Switch the Claude model |
| `/exit` | Quit the assistant |

## Project Structure

```
code_assistant/
├── __init__.py       # Package metadata
├── __main__.py       # python -m entry point
├── main.py           # CLI REPL, argument parsing, rich rendering
├── agent.py          # Agentic loop with Claude API streaming
└── tools.py          # Tool schemas + implementations
requirements.txt
pyproject.toml
```

## Available Tools (for the AI)

| Tool | What it does |
|------|--------------|
| `read_file` | Read a file with line numbers |
| `write_file` | Create or overwrite a file |
| `edit_file` | Replace an exact string in a file |
| `run_bash` | Execute a shell command (30 s timeout) |
| `list_files` | List directory contents (skips noisy dirs) |
| `search_files` | Regex search across files with `grep` |

## Example Session

```
You> read the pyproject.toml and tell me what dependencies are listed

  ⚙  read  pyproject.toml
  ┌─────────────────────────────────────────┐
  │  1 | [build-system]                     │
  │  ...                                    │
  └─────────────────────────────────────────┘

The project depends on:
- **anthropic** ≥ 0.40.0 – the Anthropic Python SDK
- **rich** ≥ 13.0.0 – terminal formatting and Markdown rendering
- **prompt_toolkit** ≥ 3.0.0 – readline-style input with history
- **pathspec** ≥ 0.12.0 – gitignore-style path matching

You> run the tests
  ⚙  bash  pytest
  ...
```

## Requirements

- Python 3.11+
- An [Anthropic API key](https://console.anthropic.com/)
