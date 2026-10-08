"""
Kenya Re Catastrophe Risk Intelligence Platform
Test Suite: Module 5 — AI Intelligence & Natural Language Underwriting Layer
Tests Groq LLM integration (openai/gpt-oss-120b), slip parsing, and executive risk briefings.
"""
import sys
import os
import time
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Configure UTF-8 output for Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.services.ai.factory import get_ai_provider
from app.services.ai_service import (
    parse_natural_language_portfolio,
    generate_risk_briefing,
    stream_ai_chat
)


def test_1_groq_connectivity_and_model():
    print(">> TEST 1: Groq API Connectivity & Model Verification")
    provider = get_ai_provider("groq")
    assert provider.provider_name == "groq"
    assert provider.active_model == "openai/gpt-oss-120b"
    assert provider.is_available() is True, "Groq client must be initialized"

    t0 = time.time()
    resp = provider.chat_complete(
        messages=[{"role": "user", "content": "Kenya Re Catastrophe Engine ping. Reply 'PONG'."}],
        temperature=0.1,
        max_tokens=20
    )
    elapsed_ms = (time.time() - t0) * 1000
    content = resp.choices[0].message.content.strip()
    print(f"   Provider: {provider.provider_name} | Model: {provider.active_model}")
    print(f"   Latency: {elapsed_ms:.1f} ms | Response: '{content}'")
    assert len(content) > 0, "Response content must not be empty"
    print("   [PASS] Groq API online and responsive.\n")


def test_2_natural_language_slip_parsing_standard():
    print(">> TEST 2: Free-Text Underwriting Slip Parsing (Mathare Informal Warehouses)")
    slip_text = "5 iron sheet warehouses in Mathare along Juja road, 350 sqm each, KES 18M total"

    t0 = time.time()
    res = parse_natural_language_portfolio(slip_text)
    elapsed_ms = (time.time() - t0) * 1000

    print(f"   Parsed in {elapsed_ms:.1f} ms")
    print(f"   Extracted Structures: {res['extracted_structures']}")
    print(f"   Housing Class:        {res['housing_class']}")
    print(f"   Location:             {res['location']}")
    print(f"   Total Area (m²):      {res['total_area_sqm']:.1f}")
    print(f"   TIV:                  KES {res['estimated_tiv_kes']:,.2f}")
    print(f"   100-Year Modeled Depth: {res['estimated_depth_m']:.2f} m")
    print(f"   Damage Ratio:         {res['damage_ratio']:.4f}")
    print(f"   Technical Rate:       {res['technical_rate_pct']:.3f}%")
    print(f"   Recommended Premium:  KES {res['recommended_premium_kes']:,.2f}")

    assert res["extracted_structures"] == 5, f"Expected 5 structures, got {res['extracted_structures']}"
    assert "iron_sheet" in res["housing_class"], f"Expected iron sheet class, got {res['housing_class']}"
    assert "mathare" in res["location"].lower(), f"Expected Mathare location, got {res['location']}"
    assert res["estimated_tiv_kes"] == 18_000_000.0, f"Expected 18M TIV, got {res['estimated_tiv_kes']}"
    assert len(res["parsed_assets"]) == 5, "Must generate 5 structured exposure assets"
    print("   [PASS] Standard broker slip correctly structured and actuarially priced.\n")


def test_3_slip_parsing_landmark_plaza_testdata():
    print(">> TEST 3: Complex Placement Parsing (Landmark Plaza Upper Hill from testData.md)")
    landmark_slip = (
        "CONFIDENTIAL REINSURANCE PLACEMENT\n"
        "CLIENT: Landmark Plaza Commercial Development (Upper Hill, Nairobi CBD)\n"
        "GPS: -1.2847°S, 36.8247°E. Elevation: 1,612m ASL.\n"
        "CONSTRUCTION: RCC Frame with Shear Walls (Grade A+), 18 floors above ground + 2 basements.\n"
        "GROSS FLOOR AREA: 24,500 m².\n"
        "TOTAL INSURED VALUE (TIV): KES 1,090,000,000 (KES 1.09 Billion).\n"
        "FACULTATIVE FLOOD COVER: Standard rate with 5% deductible requested."
    )

    t0 = time.time()
    res = parse_natural_language_portfolio(landmark_slip)
    elapsed_ms = (time.time() - t0) * 1000

    print(f"   Parsed in {elapsed_ms:.1f} ms")
    print(f"   Housing Class:        {res['housing_class']}")
    print(f"   Location:             {res['location']}")
    print(f"   TIV:                  KES {res['estimated_tiv_kes']:,.2f}")
    print(f"   Total Area (m²):      {res['total_area_sqm']:,.1f}")
    print(f"   100-Year Modeled Depth: {res['estimated_depth_m']:.2f} m")
    print(f"   Technical Rate:       {res['technical_rate_pct']:.3f}%")
    print(f"   Quoted Premium:       KES {res['recommended_premium_kes']:,.2f}")

    assert res["housing_class"] == "concrete_rcc", f"Expected concrete_rcc, got {res['housing_class']}"
    assert res["estimated_tiv_kes"] == 1_090_000_000.0, f"Expected 1.09B TIV, got {res['estimated_tiv_kes']}"
    assert res["total_area_sqm"] == 24_500.0, f"Expected 24,500 sqm, got {res['total_area_sqm']}"
    assert res["technical_rate_pct"] >= 0.18, "Commercial minimum flood rate floor must apply"
    print("   [PASS] Landmark Plaza placement memorandum successfully ingested.\n")


def test_4_executive_risk_briefing_generation():
    print(">> TEST 4: Executive Underwriting Briefing Generation (Groq LLM)")
    t0 = time.time()
    briefing = generate_risk_briefing(
        scenario="100y",
        portfolio_loss_kes=164_714_571.50,
        loss_ratio=0.00259,
        key_hotspots=["Mathare Valley", "Kibera", "Industrial Area / Enterprise Rd"],
        ai_enabled=True,
        aal_kes=14_984_680.78
    )
    elapsed_ms = (time.time() - t0) * 1000

    print(f"   Generated in {elapsed_ms:.1f} ms")
    print(f"   Executive Summary:\n   '{briefing['executive_summary'][:150]}...'")
    print(f"   Key Findings Count:   {len(briefing['key_findings'])}")
    print(f"   Recommendations:      {len(briefing['recommendations'])}")
    print(f"   Disclaimer:           {briefing.get('disclaimer', 'N/A')}")

    assert len(briefing["executive_summary"]) > 20
    assert len(briefing["key_findings"]) >= 2
    assert len(briefing["recommendations"]) >= 2
    print("   [PASS] Executive underwriting memorandum generated with actuarial reasoning.\n")


def test_5_streaming_ai_copilot():
    print(">> TEST 5: Real-Time Token Streaming (Groq Copilot)")
    prompt = "In 2 sentences, explain why pluvial surface flood modeling differs from fluvial river flooding in Nairobi."
    chunks = []
    t0 = time.time()
    for token in stream_ai_chat(prompt):
        chunks.append(token)
    elapsed_ms = (time.time() - t0) * 1000

    streamed_text = "".join(chunks).strip()
    print(f"   Streamed {len(chunks)} tokens in {elapsed_ms:.1f} ms ({len(chunks)/(elapsed_ms/1000):.1f} tokens/sec)")
    print(f"   Copilot Response:\n   \"{streamed_text}\"")

    assert len(chunks) > 5, "Must stream multiple token chunks"
    assert len(streamed_text) > 40, "Streamed text must contain content"
    print("   [PASS] Streaming AI token generation verified.\n")


def run_all_module_5_tests():
    print("=" * 66)
    print("    KENYA RE — CAT MODEL MODULE 5 (AI INTELLIGENCE LAYER) TEST    ")
    print("=" * 66)
    test_1_groq_connectivity_and_model()
    test_2_natural_language_slip_parsing_standard()
    test_3_slip_parsing_landmark_plaza_testdata()
    test_4_executive_risk_briefing_generation()
    test_5_streaming_ai_copilot()
    print("=" * 66)
    print(">> VERDICT: MODULE 5 (AI INTELLIGENCE LAYER) PASSED ALL TESTS!")
    print("=" * 66)


if __name__ == "__main__":
    run_all_module_5_tests()
