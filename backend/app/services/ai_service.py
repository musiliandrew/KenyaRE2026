"""
Kenya Re Catastrophe Risk Intelligence Platform
Module 5: AI Intelligence Service Layer
Decoupled facade for Natural Language Slip Parsing & Underwriter Executive Briefings.
Powered by Groq with plug-and-play architecture.
"""
from typing import Dict, List, Optional, Any, Iterator
from app.services.ai.factory import get_ai_provider


def parse_natural_language_portfolio(text: str, provider_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Parses unstructured broker underwriting notes or placement memorandums into
    validated, geocoded, and actuarially enriched exposure assets.
    """
    provider = get_ai_provider(provider_name)
    return provider.parse_underwriting_slip(text)


def generate_risk_briefing(
    scenario: str,
    portfolio_loss_kes: float,
    loss_ratio: float,
    key_hotspots: List[str],
    ai_enabled: bool = True,
    aal_kes: Optional[float] = None,
    provider_name: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generates a natural-language executive catastrophe risk briefing for underwriters
    and reinsurance executive committees.
    """
    provider = get_ai_provider(provider_name)
    return provider.generate_executive_briefing(
        scenario=scenario,
        portfolio_loss_kes=portfolio_loss_kes,
        loss_ratio=loss_ratio,
        key_hotspots=key_hotspots,
        ai_enabled=ai_enabled,
        aal_kes=aal_kes,
    )


def stream_ai_chat(prompt: str, history: Optional[List[Dict[str, str]]] = None) -> Iterator[str]:
    """
    Streams tokens in real time from the active LLM provider (e.g. Groq openai/gpt-oss-120b).
    """
    provider = get_ai_provider()
    messages = []
    
    system_msg = {
        "role": "system",
        "content": (
            "You are Kenya Re's AI Catastrophe Risk Copilot. You assist underwriters, "
            "reinsurance brokers, and risk managers with urban flood peril modeling in Nairobi, "
            "exposure management, JRC vulnerability curves, CLIMADA workflows, and treaty structuring. "
            "Be concise, highly knowledgeable, and actuarially sound."
        )
    }
    messages.append(system_msg)

    if history:
        messages.extend(history)

    messages.append({"role": "user", "content": prompt})

    completion = provider.chat_complete(
        messages=messages,
        temperature=0.7,
        max_tokens=2048,
        stream=True
    )

    for chunk in completion:
        token = chunk.choices[0].delta.content or ""
        if token:
            yield token
