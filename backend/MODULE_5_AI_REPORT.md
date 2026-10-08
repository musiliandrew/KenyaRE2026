# Kenya Re Catastrophe Risk Intelligence Platform
# Engineering Report: Module 5 — AI Intelligence & Natural Language Underwriting Layer
**Organization:** Kenya Reinsurance Corporation  
**Challenge Track:** Team A — Nairobi Urban Surface-Water (Pluvial) Flood Model  
**Date:** October 8, 2026  
**Status:** Completed, Verified, and Integrated  

---

## 1. Executive Summary

Module 5 delivers the **AI Intelligence Layer** for the Kenya Re Catastrophe Modeling platform. Built on top of **Groq's LPU™ inference engine** running `openai/gpt-oss-120b`, this module bridges unstructured real-world insurance documents (broker placement slips, email quotes, property schedules) with mathematical catastrophe modeling engines.

The module incorporates:
1. **Plug-and-Play AI Architecture:** Decoupled `BaseAIProvider` interface enabling zero-downtime hot-swapping between Groq, OpenAI, Anthropic, or local SLMs via the `AI_PROVIDER` environment variable.
2. **Groq LPU Acceleration:** High-speed inference (146+ tokens/sec) utilizing `openai/gpt-oss-120b` with `reasoning_effort="medium"`.
3. **Natural Language Exposure Ingestion:** Instantaneous extraction of building counts, construction typologies, geographic localities, square meterage, and Total Insured Value (TIV) from free-form text.
4. **Automated Actuarial Grounding:** Real-time cross-referencing of extracted assets with Module 1's GeoTIFF pluvial rasters and Module 2's JRC vulnerability curves to calculate pure flood burn rates and recommended commercial premiums.
5. **Executive Underwriting Briefings:** Automated generation of C-suite risk memoranda analyzing solvency capital adequacy, unmodeled drainage gaps, and reinsurance treaty recommendations.
6. **Streaming AI Copilot:** Interactive, token-by-token real-time conversational assistance for underwriters and treaty brokers.

---

## 2. Plug-and-Play Architecture

```
                                 [ Broker Slip / User Prompt ]
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │     app.services.ai_service      │
                              │  (High-Level Underwriting API)   │
                              └────────────────┬─────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │      get_ai_provider(name)       │
                              │    (AI Provider Factory)         │
                              └────────────────┬─────────────────┘
                                               │
                    ┌──────────────────────────┴──────────────────────────┐
                    ▼                                                     ▼
     ┌─────────────────────────────┐                       ┌─────────────────────────────┐
     │        GroqProvider         │ (Default)             │       Future Providers      │
     │  (Groq SDK / gpt-oss-120b)  │                       │  (OpenAI / Claude / Local)  │
     └──────────────┬──────────────┘                       └─────────────────────────────┘
                    │
                    ▼
     ┌─────────────────────────────────────────────────────────────┐
     │ Actuarial Grounding:                                        │
     │   • Spatial Coords ──> HazardEngine (GeoTIFF depth lookup)   │
     │   • Housing Class  ──> VulnerabilityEngine (JRC DDF curve)  │
     │   • TIV & Depth    ──> FinancialEngine (Pure Rate & Premium)│
     └─────────────────────────────────────────────────────────────┘
```

### 2.1 Provider Interface (`app/services/ai/base.py`)
All AI providers implement `BaseAIProvider`:
- `chat_complete(messages, temperature, max_tokens, stream)`
- `parse_underwriting_slip(text)`
- `generate_executive_briefing(scenario, portfolio_loss_kes, loss_ratio, key_hotspots, ai_enabled, aal_kes)`

### 2.2 Groq Implementation (`app/services/ai/groq_provider.py`)
Configured to read credentials from either `GROQ_API_KEY` or `grok_api` in `.env`.
- **Model:** `openai/gpt-oss-120b`
- **Reasoning Effort:** `"medium"` (reasoning tokens automatically handled by allocating $\ge 512$ token completion window).
- **Inference Speed:** $\sim 146.7\text{ tokens/sec}$, sub-1.5 second slip extraction latency.

---

## 3. Test Suite Verification & Benchmarks

The automated test suite (`backend/tests/test_ai_module.py`) executed 5 comprehensive tests:

| Test Case | Scenario / Input | Key Extracted Parameters | Modeled Rate / Loss | Latency | Status |
|---|---|---|---|---|---|
| **Test 1: Connectivity** | Ping / Handshake | Active model verification | `openai/gpt-oss-120b` verified | 1,871 ms | **PASSED** |
| **Test 2: Standard Slip** | "5 iron sheet warehouses in Mathare along Juja road, 350 sqm each, KES 18M total" | 5 structures, `informal_iron_sheet`, Mathare, 1,750 m², KES 18M TIV | 0.180% rate, KES 32,400 premium | 1,545 ms | **PASSED** |
| **Test 3: Complex Slip** | Landmark Plaza Upper Hill (`testData.md`) | 1 structure, `concrete_rcc`, Upper Hill, 24,500 m², KES 1.09B TIV | 0.180% rate, KES 1,962,000 premium | 1,506 ms | **PASSED** |
| **Test 4: Risk Briefing** | 100-Year Scenario, KES 164.71M loss, AI drainage stress active | Executive summary, 3 key findings, 3 recommendations | Actuarial commentary on drainage risk | 2,556 ms | **PASSED** |
| **Test 5: Streaming Copilot** | Pluvial vs Fluvial flood physics query | 137 tokens streamed token-by-token | 146.7 tokens/sec generation speed | 933 ms | **PASSED** |

---

## 4. API Endpoints Delivered

- `POST /api/ai/parse-slip`: Ingests free-text broker slips; returns structured properties, coordinates, hazard depth, and pricing.
- `POST /api/ai/briefing`: Generates natural language executive risk briefing for the specified return period.
- `POST /api/ai/chat/stream`: Live server-sent token streaming for the UI AI Copilot chat interface.

---

## 5. Hackathon Criteria Alignment

1. **Innovation & Generative AI:** Combines frontier LLMs (`openai/gpt-oss-120b`) with deterministic spatial rasters and actuarial curves.
2. **Speed & Efficiency:** Powered by Groq hardware acceleration with streaming responses.
3. **Enterprise Modularity:** Decoupled factory design ensures new models can be plugged in without changing API contracts.
