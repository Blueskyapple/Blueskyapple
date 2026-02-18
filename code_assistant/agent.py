"""AI agent loop: sends messages to Claude, handles tool calls, streams output."""

from __future__ import annotations

import os
from typing import Iterator

import anthropic

from .tools import TOOL_SCHEMAS, execute_tool

# System prompt mirrors the philosophy of Claude Code
SYSTEM_PROMPT = """\
You are an expert AI coding assistant running in the terminal. You help users with
software engineering tasks: writing code, debugging, refactoring, explaining concepts,
running tests, and managing files.

You have access to tools that let you read and write files, edit files precisely,
run bash commands, list directory contents, and search code.

Guidelines:
- Think carefully before acting. Plan multi-step tasks using your tools.
- Prefer making minimal, targeted changes rather than rewriting large swaths of code.
- When fixing bugs, read the relevant code first before proposing changes.
- Always confirm destructive operations (like deleting files) before proceeding.
- When running commands, explain what you're doing and why.
- If a task is ambiguous, ask a clarifying question rather than guessing.
- Be concise. The user is in a terminal; avoid long prose unless asked to explain.
"""

MAX_TOKENS = 8096
MODEL = "claude-opus-4-6"


class Agent:
    """Manages conversation state and the agentic tool-call loop."""

    def __init__(self, api_key: str, cwd: str, model: str = MODEL):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.cwd = cwd
        self.model = model
        self.messages: list[dict] = []

    def reset(self) -> None:
        """Clear conversation history."""
        self.messages = []

    def stream_response(self, user_input: str) -> Iterator[dict]:
        """
        Add the user message, run the agentic loop, and yield events:
          {"type": "text", "text": str}            - streamed assistant text
          {"type": "tool_start", "name": str, "input": dict}
          {"type": "tool_result", "name": str, "result": str}
          {"type": "error", "text": str}
          {"type": "done"}
        """
        self.messages.append({"role": "user", "content": user_input})

        while True:
            # Collect streamed content blocks
            text_chunks: list[str] = []
            tool_uses: list[dict] = []  # {id, name, input}

            try:
                with self.client.messages.stream(
                    model=self.model,
                    max_tokens=MAX_TOKENS,
                    system=SYSTEM_PROMPT,
                    tools=TOOL_SCHEMAS,
                    messages=self.messages,
                ) as stream:
                    current_tool: dict | None = None
                    current_tool_json: list[str] = []

                    for event in stream:
                        etype = event.type

                        if etype == "content_block_start":
                            block = event.content_block
                            if block.type == "text":
                                pass  # text deltas come next
                            elif block.type == "tool_use":
                                current_tool = {"id": block.id, "name": block.name, "input_raw": ""}
                                current_tool_json = []

                        elif etype == "content_block_delta":
                            delta = event.delta
                            if delta.type == "text_delta":
                                text_chunks.append(delta.text)
                                yield {"type": "text", "text": delta.text}
                            elif delta.type == "input_json_delta":
                                if current_tool is not None:
                                    current_tool_json.append(delta.partial_json)

                        elif etype == "content_block_stop":
                            if current_tool is not None:
                                import json
                                raw = "".join(current_tool_json)
                                try:
                                    current_tool["input"] = json.loads(raw) if raw else {}
                                except json.JSONDecodeError:
                                    current_tool["input"] = {}
                                tool_uses.append(current_tool)
                                current_tool = None
                                current_tool_json = []

                    final_msg = stream.get_final_message()

            except anthropic.AuthenticationError:
                yield {"type": "error", "text": "Authentication failed. Check your ANTHROPIC_API_KEY."}
                yield {"type": "done"}
                return
            except anthropic.APIConnectionError as e:
                yield {"type": "error", "text": f"Connection error: {e}"}
                yield {"type": "done"}
                return
            except Exception as e:
                yield {"type": "error", "text": f"API error: {e}"}
                yield {"type": "done"}
                return

            # Build the assistant message to add to history
            assistant_content: list[dict] = []
            if text_chunks:
                assistant_content.append({"type": "text", "text": "".join(text_chunks)})
            for tu in tool_uses:
                assistant_content.append({
                    "type": "tool_use",
                    "id": tu["id"],
                    "name": tu["name"],
                    "input": tu["input"],
                })

            if assistant_content:
                self.messages.append({"role": "assistant", "content": assistant_content})

            # If no tool calls, we're done
            if not tool_uses:
                break

            # Execute each tool and collect results
            tool_result_content: list[dict] = []
            for tu in tool_uses:
                yield {"type": "tool_start", "name": tu["name"], "input": tu["input"]}
                result = execute_tool(tu["name"], tu["input"], self.cwd)
                yield {"type": "tool_result", "name": tu["name"], "result": result}
                tool_result_content.append({
                    "type": "tool_result",
                    "tool_use_id": tu["id"],
                    "content": result,
                })

            # Add tool results to history and loop for the next assistant turn
            self.messages.append({"role": "user", "content": tool_result_content})

        yield {"type": "done"}
