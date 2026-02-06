"""Base class for BlueBot skills (plugins)."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class Skill(ABC):
    """A skill the agent can invoke."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Short unique name, e.g. 'shell'."""

    @property
    @abstractmethod
    def description(self) -> str:
        """One-line description shown to the LLM."""

    @property
    def args_schema(self) -> dict[str, Any] | None:
        """Optional JSON-like schema describing the expected args."""
        return None

    @abstractmethod
    def run(self, **kwargs: Any) -> str:
        """Execute the skill and return a text result."""
