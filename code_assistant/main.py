"""
code-assistant  –  A Claude Code-style AI coding agent for the terminal.

Usage:
    python -m code_assistant [options] [initial prompt]

Environment:
    ANTHROPIC_API_KEY   Your Anthropic API key (required)
"""

from __future__ import annotations

import os
import sys
import argparse
import json
from pathlib import Path

from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from rich.rule import Rule
from rich.style import Style
from rich.syntax import Syntax
from rich.text import Text
from prompt_toolkit import PromptSession
from prompt_toolkit.history import FileHistory
from prompt_toolkit.auto_suggest import AutoSuggestFromHistory
from prompt_toolkit.styles import Style as PtStyle

from .agent import Agent

# ── colour palette ──────────────────────────────────────────────────────────
PALETTE = {
    "brand":   "#E5805C",   # warm orange – brand colour
    "user":    "#7CB9E8",   # sky-blue user label
    "tool":    "#A8D5BA",   # sage green for tool events
    "result":  "#B8A9C9",   # lavender for tool results
    "error":   "#FF6B6B",   # coral red for errors
    "dim":     "#666666",
    "muted":   "#888888",
}

console = Console(highlight=False)


# ── helpers ──────────────────────────────────────────────────────────────────

def _banner() -> None:
    console.print(
        Panel.fit(
            "[bold]code-assistant[/bold]  [dim]v0.1[/dim]\n"
            "[dim]An AI coding agent powered by Claude\n"
            "Type [white]/help[/white] for commands, [white]/exit[/white] to quit[/dim]",
            border_style=PALETTE["brand"],
            padding=(0, 2),
        )
    )
    console.print()


def _help() -> None:
    console.print(
        Panel(
            "[bold]Commands[/bold]\n\n"
            "  [white]/help[/white]          Show this help message\n"
            "  [white]/clear[/white]         Clear conversation history\n"
            "  [white]/cwd [path][/white]    Change the working directory\n"
            "  [white]/model [name][/white]  Switch Claude model\n"
            "  [white]/exit[/white]          Quit\n\n"
            "[bold]Tips[/bold]\n\n"
            "  • Ask me to read files, write code, run tests, explain errors…\n"
            "  • I can execute bash commands in your working directory.\n"
            "  • Conversation history is kept until you use /clear.",
            border_style=PALETTE["dim"],
            title="[bold]Help[/bold]",
            padding=(0, 2),
        )
    )


def _format_tool_input(name: str, inp: dict) -> str:
    """Return a compact, human-readable description of a tool call."""
    if name == "read_file":
        return f"read  {inp.get('path', '')}"
    if name == "write_file":
        lines = inp.get("content", "").splitlines()
        return f"write {inp.get('path', '')}  ({len(lines)} lines)"
    if name == "edit_file":
        return f"edit  {inp.get('path', '')}"
    if name == "run_bash":
        cmd = inp.get("command", "")
        return f"bash  {cmd[:80]}{'…' if len(cmd) > 80 else ''}"
    if name == "list_files":
        return f"ls    {inp.get('path', '.') or '.'}"
    if name == "search_files":
        return f"grep  {inp.get('pattern', '')}  {inp.get('path', '.') or '.'}"
    return f"{name} {json.dumps(inp)[:60]}"


def _render_tool_result(name: str, result: str) -> None:
    """Pretty-print a tool result with syntax highlighting where useful."""
    MAX = 50  # max lines before we truncate in the display
    lines = result.splitlines()
    truncated = len(lines) > MAX
    display = "\n".join(lines[:MAX]) + ("\n[dim]… (truncated)[/dim]" if truncated else "")

    # Syntax highlight shell output / code
    if name in ("run_bash",):
        console.print(
            Panel(
                Syntax(display, "bash", theme="monokai", word_wrap=True),
                border_style=PALETTE["result"],
                padding=(0, 1),
            )
        )
    elif name in ("read_file", "write_file", "edit_file"):
        # Try to detect language from first line "File: path.ext"
        lang = "text"
        if lines:
            first = lines[0]
            if first.startswith("File:"):
                ext = Path(first.split(":", 1)[1].strip()).suffix.lstrip(".")
                lang_map = {
                    "py": "python", "js": "javascript", "ts": "typescript",
                    "sh": "bash", "md": "markdown", "json": "json",
                    "yaml": "yaml", "yml": "yaml", "toml": "toml",
                    "c": "c", "cpp": "cpp", "go": "go", "rs": "rust",
                    "html": "html", "css": "css", "sql": "sql",
                }
                lang = lang_map.get(ext, "text")
        console.print(
            Panel(
                Syntax(display, lang, theme="monokai", line_numbers=False, word_wrap=True),
                border_style=PALETTE["result"],
                padding=(0, 1),
            )
        )
    else:
        console.print(
            Panel(display, border_style=PALETTE["result"], padding=(0, 1))
        )


# ── main REPL ────────────────────────────────────────────────────────────────

def run(
    api_key: str,
    cwd: str,
    model: str,
    initial_prompt: str | None = None,
) -> None:
    agent = Agent(api_key=api_key, cwd=cwd, model=model)

    history_file = Path.home() / ".code_assistant_history"
    session: PromptSession = PromptSession(
        history=FileHistory(str(history_file)),
        auto_suggest=AutoSuggestFromHistory(),
        style=PtStyle.from_dict({"prompt": f"bold {PALETTE['brand']}"}),
    )

    _banner()
    console.print(f"[{PALETTE['dim']}]Working directory: {cwd}[/]")
    console.print(f"[{PALETTE['dim']}]Model: {model}[/]")
    console.print()

    def handle_input(user_input: str) -> None:
        """Process one user input through the agent and render all events."""
        nonlocal cwd

        # Slash commands
        stripped = user_input.strip()
        if stripped.startswith("/"):
            parts = stripped.split(None, 1)
            cmd = parts[0].lower()
            arg = parts[1] if len(parts) > 1 else ""

            if cmd in ("/exit", "/quit", "/q"):
                console.print(f"\n[{PALETTE['muted']}]Goodbye![/]")
                sys.exit(0)
            elif cmd == "/help":
                _help()
                return
            elif cmd == "/clear":
                agent.reset()
                console.print(f"[{PALETTE['tool']}]Conversation history cleared.[/]")
                return
            elif cmd == "/cwd":
                new_dir = arg.strip() or "."
                new_dir = os.path.expanduser(new_dir)
                if not os.path.isdir(new_dir):
                    console.print(f"[{PALETTE['error']}]Not a directory: {new_dir}[/]")
                else:
                    cwd = os.path.abspath(new_dir)
                    agent.cwd = cwd
                    console.print(f"[{PALETTE['tool']}]Working directory changed to: {cwd}[/]")
                return
            elif cmd == "/model":
                if arg.strip():
                    agent.model = arg.strip()
                    console.print(f"[{PALETTE['tool']}]Model changed to: {agent.model}[/]")
                else:
                    console.print(f"[{PALETTE['dim']}]Current model: {agent.model}[/]")
                return
            else:
                console.print(f"[{PALETTE['error']}]Unknown command: {cmd}  (type /help)[/]")
                return

        # Normal message → agent
        console.print()
        console.rule(style=PALETTE["dim"])

        # Buffer assistant text so we can render it as Markdown at the end
        text_buffer: list[str] = []
        in_text_stream = False

        for event in agent.stream_response(user_input):
            etype = event["type"]

            if etype == "text":
                if not in_text_stream:
                    in_text_stream = True
                text_buffer.append(event["text"])

            elif etype == "tool_start":
                # If there was buffered text, flush it first
                if text_buffer:
                    full_text = "".join(text_buffer)
                    console.print(Markdown(full_text))
                    text_buffer = []
                    in_text_stream = False
                label = _format_tool_input(event["name"], event["input"])
                console.print(
                    f"  [{PALETTE['tool']}]⚙  {label}[/]"
                )

            elif etype == "tool_result":
                _render_tool_result(event["name"], event["result"])

            elif etype == "error":
                console.print(f"\n[{PALETTE['error']}]Error: {event['text']}[/]")

            elif etype == "done":
                pass  # will flush text below

        # Flush any remaining text
        if text_buffer:
            full_text = "".join(text_buffer)
            console.print(Markdown(full_text))

        console.print()

    # Handle initial prompt passed on the command line
    if initial_prompt:
        handle_input(initial_prompt)

    # Interactive loop
    while True:
        try:
            user_input = session.prompt("\nYou> ")
        except (KeyboardInterrupt, EOFError):
            console.print(f"\n[{PALETTE['muted']}]Goodbye![/]")
            break

        if not user_input.strip():
            continue

        handle_input(user_input)


# ── entry point ──────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        prog="code-assistant",
        description="An AI coding agent powered by Claude",
    )
    parser.add_argument(
        "prompt",
        nargs="?",
        help="Optional initial prompt to send immediately on startup.",
    )
    parser.add_argument(
        "--model",
        default="claude-opus-4-6",
        help="Claude model to use (default: claude-opus-4-6)",
    )
    parser.add_argument(
        "--cwd",
        default=None,
        help="Set the working directory (default: current directory)",
    )
    parser.add_argument(
        "--api-key",
        default=None,
        help="Anthropic API key (falls back to ANTHROPIC_API_KEY env var)",
    )
    args = parser.parse_args()

    api_key = args.api_key or os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        console.print(
            f"[{PALETTE['error']}]Error: ANTHROPIC_API_KEY is not set.\n"
            "Set it with:  export ANTHROPIC_API_KEY=sk-ant-...[/]"
        )
        sys.exit(1)

    cwd = os.path.abspath(args.cwd or os.getcwd())

    run(api_key=api_key, cwd=cwd, model=args.model, initial_prompt=args.prompt)


if __name__ == "__main__":
    main()
