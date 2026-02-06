"""Entry point: python -m bluebot  or  bluebot (after pip install)."""

from __future__ import annotations

import asyncio
import logging
import sys

from rich.console import Console

from bluebot.config import load_config
from bluebot.gateway import Gateway

console = Console()

BANNER = r"""
[bold blue]
  ____  _            ____        _
 | __ )| |_   _  ___| __ )  ___ | |_
 |  _ \| | | | |/ _ \  _ \ / _ \| __|
 | |_) | | |_| |  __/ |_) | (_) | |_
 |____/|_|\__,_|\___|____/ \___/ \__|
[/]
  [dim]Your personal AI assistant[/]
"""


def main() -> None:
    console.print(BANNER)

    config = load_config()

    # Validate API key
    if not config.api_key:
        console.print(
            "[bold red]Error:[/] No API key found.\n"
            f"Set [bold]{config.llm_provider.upper()}_API_KEY[/] in your "
            "environment or .env file.\n"
            "See .env.example for reference."
        )
        sys.exit(1)

    # Configure logging
    logging.basicConfig(
        level=getattr(logging, config.log_level.upper(), logging.INFO),
        format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
        datefmt="%H:%M:%S",
    )

    console.print(f"  Provider: [cyan]{config.llm_provider}[/]")
    console.print(f"  Model:    [cyan]{config.resolved_model}[/]")
    console.print(f"  Adapters: [cyan]{', '.join(config.enabled_adapters)}[/]")
    console.print(f"  Memory:   [cyan]{config.memory_dir}[/]")
    console.print()

    gateway = Gateway(config)
    try:
        asyncio.run(gateway.run())
    except KeyboardInterrupt:
        console.print("\n[dim]BlueBot stopped.[/]")


if __name__ == "__main__":
    main()
