"""
Kenya Re Catastrophe Risk Intelligence Platform
Module 5: AI Intelligence Layer - Base Provider Interface
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Iterator


class BaseAIProvider(ABC):
    """
    Abstract interface for AI/LLM providers in the catastrophe risk pipeline.
    Ensures plug-and-play modularity (Groq, OpenAI, Anthropic, or local SLMs).
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the provider (e.g. 'groq', 'openai', 'fallback')."""
        pass

    @property
    @abstractmethod
    def active_model(self) -> str:
        """Active model identifier."""
        pass

    @abstractmethod
    def chat_complete(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        stream: bool = False,
    ) -> Any:
        """Executes a chat completion request."""
        pass

    @abstractmethod
    def parse_underwriting_slip(self, text: str) -> Dict[str, Any]:
        """
        Extracts structured underwriting exposure and policy parameters from
        unstructured free text or broker placement memorandums.
        """
        pass

    @abstractmethod
    def generate_executive_briefing(
        self,
        scenario: str,
        portfolio_loss_kes: float,
        loss_ratio: float,
        key_hotspots: List[str],
        ai_enabled: bool = True,
        aal_kes: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Generates an executive-level catastrophe risk briefing for reinsurance
        underwriters and solvency committee members.
        """
        pass
