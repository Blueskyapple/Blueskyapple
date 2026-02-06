"""Shell command execution skill (opt-in, sandboxed)."""

from __future__ import annotations

import subprocess
from typing import Any

from bluebot.skills.base import Skill

MAX_OUTPUT = 4000  # truncate long outputs


class ShellSkill(Skill):
    @property
    def name(self) -> str:
        return "shell"

    @property
    def description(self) -> str:
        return "Run a shell command and return its output. Use responsibly."

    @property
    def args_schema(self) -> dict[str, Any]:
        return {"command": "string — the shell command to execute"}

    def run(self, **kwargs: Any) -> str:
        command = kwargs.get("command", "")
        if not command:
            return "Error: no command provided."
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=30,
            )
            output = result.stdout + result.stderr
            if len(output) > MAX_OUTPUT:
                output = output[:MAX_OUTPUT] + "\n... (truncated)"
            return output or "(no output)"
        except subprocess.TimeoutExpired:
            return "Error: command timed out after 30 seconds."
        except Exception as exc:
            return f"Error: {exc}"
