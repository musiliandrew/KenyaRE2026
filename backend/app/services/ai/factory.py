"""
Kenya Re Catastrophe Risk Intelligence Platform
Module 5: AI Provider Factory (Plug-and-Play Architecture)
"""
import os
import logging
from typing import Optional
from dotenv import load_dotenv

from app.services.ai.base import BaseAIProvider
from app.services.ai.groq_provider import GroqProvider

load_dotenv()
logger = logging.getLogger(__name__)

# Cached provider singleton
_ACTIVE_PROVIDER: Optional[BaseAIProvider] = None


def get_ai_provider(provider_name: Optional[str] = None) -> BaseAIProvider:
    """
    Factory method to instantiate the requested AI provider.
    Enables plug-and-play switching via environment variable AI_PROVIDER.
    Supported: 'groq' (default), with extensible slots for future models.
    """
    global _ACTIVE_PROVIDER

    selected = (provider_name or os.getenv("AI_PROVIDER", "groq")).lower()

    if _ACTIVE_PROVIDER and _ACTIVE_PROVIDER.provider_name == selected:
        return _ACTIVE_PROVIDER

    if selected == "groq":
        model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
        _ACTIVE_PROVIDER = GroqProvider(model=model)
    else:
        logger.warning(f"Unknown provider '{selected}', defaulting to Groq.")
        _ACTIVE_PROVIDER = GroqProvider()

    return _ACTIVE_PROVIDER
