"""Tool implementations for the code assistant agent."""

import os
import subprocess
import glob as glob_module
from pathlib import Path


# ---------------------------------------------------------------------------
# Tool schemas (passed to the Claude API)
# ---------------------------------------------------------------------------

TOOL_SCHEMAS = [
    {
        "name": "read_file",
        "description": (
            "Read the full contents of a file at the given path. "
            "Returns the file contents as a string."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Absolute or relative path to the file to read.",
                }
            },
            "required": ["path"],
        },
    },
    {
        "name": "write_file",
        "description": (
            "Write content to a file, creating it or overwriting it if it exists. "
            "Creates any necessary parent directories."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Absolute or relative path of the file to write.",
                },
                "content": {
                    "type": "string",
                    "description": "The content to write to the file.",
                },
            },
            "required": ["path", "content"],
        },
    },
    {
        "name": "edit_file",
        "description": (
            "Replace an exact string in a file with new content. "
            "The old_string must match exactly (including whitespace/indentation). "
            "Fails if old_string is not found or matches multiple times."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Path to the file to edit.",
                },
                "old_string": {
                    "type": "string",
                    "description": "The exact string to replace.",
                },
                "new_string": {
                    "type": "string",
                    "description": "The string to replace it with.",
                },
            },
            "required": ["path", "old_string", "new_string"],
        },
    },
    {
        "name": "run_bash",
        "description": (
            "Execute a bash command and return its stdout and stderr. "
            "Commands time out after 30 seconds. "
            "Use for running tests, linters, builds, git operations, etc."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "command": {
                    "type": "string",
                    "description": "The bash command to execute.",
                },
                "cwd": {
                    "type": "string",
                    "description": "Working directory for the command (optional).",
                },
            },
            "required": ["command"],
        },
    },
    {
        "name": "list_files",
        "description": (
            "List files and directories at the given path. "
            "Returns a tree-like listing."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Directory path to list. Defaults to current directory.",
                },
                "pattern": {
                    "type": "string",
                    "description": "Optional glob pattern to filter results (e.g. '**/*.py').",
                },
            },
            "required": [],
        },
    },
    {
        "name": "search_files",
        "description": (
            "Search for a regex pattern in file contents recursively. "
            "Returns matching lines with file names and line numbers."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "pattern": {
                    "type": "string",
                    "description": "Regex pattern to search for.",
                },
                "path": {
                    "type": "string",
                    "description": "Directory to search in (defaults to current directory).",
                },
                "file_glob": {
                    "type": "string",
                    "description": "Glob to filter files (e.g. '*.py'). Optional.",
                },
            },
            "required": ["pattern"],
        },
    },
]


# ---------------------------------------------------------------------------
# Tool execution
# ---------------------------------------------------------------------------

def _resolve(path: str, cwd: str) -> str:
    p = Path(path)
    if not p.is_absolute():
        p = Path(cwd) / p
    return str(p.resolve())


def tool_read_file(path: str, cwd: str) -> str:
    full = _resolve(path, cwd)
    try:
        with open(full, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        lines = content.splitlines()
        numbered = "\n".join(f"{i+1:4d} | {line}" for i, line in enumerate(lines))
        return f"File: {full}\n\n{numbered}"
    except FileNotFoundError:
        return f"Error: file not found: {full}"
    except Exception as e:
        return f"Error reading file: {e}"


def tool_write_file(path: str, content: str, cwd: str) -> str:
    full = _resolve(path, cwd)
    try:
        Path(full).parent.mkdir(parents=True, exist_ok=True)
        with open(full, "w", encoding="utf-8") as f:
            f.write(content)
        return f"Written {len(content)} bytes to {full}"
    except Exception as e:
        return f"Error writing file: {e}"


def tool_edit_file(path: str, old_string: str, new_string: str, cwd: str) -> str:
    full = _resolve(path, cwd)
    try:
        with open(full, "r", encoding="utf-8") as f:
            content = f.read()
        count = content.count(old_string)
        if count == 0:
            return f"Error: old_string not found in {full}"
        if count > 1:
            return f"Error: old_string found {count} times in {full}; provide more context to make it unique"
        new_content = content.replace(old_string, new_string, 1)
        with open(full, "w", encoding="utf-8") as f:
            f.write(new_content)
        return f"Edited {full}: replaced 1 occurrence"
    except FileNotFoundError:
        return f"Error: file not found: {full}"
    except Exception as e:
        return f"Error editing file: {e}"


def tool_run_bash(command: str, cwd: str, provided_cwd: str | None = None) -> str:
    working_dir = provided_cwd if provided_cwd else cwd
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=working_dir,
            capture_output=True,
            text=True,
            timeout=30,
        )
        out = result.stdout.strip()
        err = result.stderr.strip()
        parts = []
        if out:
            parts.append(f"stdout:\n{out}")
        if err:
            parts.append(f"stderr:\n{err}")
        parts.append(f"exit code: {result.returncode}")
        return "\n\n".join(parts) if parts else "(no output)"
    except subprocess.TimeoutExpired:
        return "Error: command timed out after 30 seconds"
    except Exception as e:
        return f"Error running command: {e}"


def tool_list_files(path: str | None, pattern: str | None, cwd: str) -> str:
    base = _resolve(path, cwd) if path else cwd
    if not os.path.isdir(base):
        return f"Error: not a directory: {base}"

    if pattern:
        matches = sorted(glob_module.glob(os.path.join(base, pattern), recursive=True))
        if not matches:
            return f"No files match pattern '{pattern}' in {base}"
        return "\n".join(os.path.relpath(m, base) for m in matches)

    # Simple recursive listing (skip hidden and common noise dirs)
    SKIP_DIRS = {".git", "__pycache__", "node_modules", ".venv", "venv", ".env",
                 "dist", "build", ".pytest_cache", ".mypy_cache"}
    lines = []
    for root, dirs, files in os.walk(base):
        dirs[:] = [d for d in sorted(dirs) if d not in SKIP_DIRS]
        rel = os.path.relpath(root, base)
        depth = 0 if rel == "." else rel.count(os.sep) + 1
        prefix = "  " * depth
        folder_name = os.path.basename(root) if rel != "." else base
        lines.append(f"{prefix}{folder_name}/")
        for fname in sorted(files):
            lines.append(f"{prefix}  {fname}")
        if len(lines) > 300:
            lines.append("  ... (truncated)")
            break
    return "\n".join(lines)


def tool_search_files(pattern: str, path: str | None, file_glob: str | None, cwd: str) -> str:
    base = _resolve(path, cwd) if path else cwd
    glob_flag = ["--glob", file_glob] if file_glob else []
    cmd = ["grep", "-rn", "--include=*", "-E", pattern, base]
    if file_glob:
        # Use find+grep for glob filtering
        cmd = ["bash", "-c",
               f"grep -rn -E {pattern!r} --include={file_glob!r} {base!r}"]
    try:
        result = subprocess.run(
            ["grep", "-rn", "-E", pattern, base]
            + (["--include", file_glob] if file_glob else []),
            capture_output=True, text=True, timeout=15,
        )
        output = result.stdout.strip()
        if not output:
            return f"No matches for pattern '{pattern}' in {base}"
        lines = output.splitlines()
        if len(lines) > 100:
            lines = lines[:100]
            lines.append("... (truncated to 100 lines)")
        # Make paths relative for readability
        rel_lines = []
        for line in lines:
            try:
                parts = line.split(":", 2)
                rel_path = os.path.relpath(parts[0], cwd)
                rel_lines.append(f"{rel_path}:{parts[1]}:{parts[2]}")
            except Exception:
                rel_lines.append(line)
        return "\n".join(rel_lines)
    except subprocess.TimeoutExpired:
        return "Error: search timed out"
    except Exception as e:
        return f"Error searching files: {e}"


def execute_tool(name: str, inputs: dict, cwd: str) -> str:
    """Dispatch a tool call and return its string result."""
    if name == "read_file":
        return tool_read_file(inputs["path"], cwd)
    elif name == "write_file":
        return tool_write_file(inputs["path"], inputs["content"], cwd)
    elif name == "edit_file":
        return tool_edit_file(inputs["path"], inputs["old_string"], inputs["new_string"], cwd)
    elif name == "run_bash":
        return tool_run_bash(inputs["command"], cwd, inputs.get("cwd"))
    elif name == "list_files":
        return tool_list_files(inputs.get("path"), inputs.get("pattern"), cwd)
    elif name == "search_files":
        return tool_search_files(
            inputs["pattern"], inputs.get("path"), inputs.get("file_glob"), cwd
        )
    else:
        return f"Error: unknown tool '{name}'"
