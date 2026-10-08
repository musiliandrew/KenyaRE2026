I'll outline a backend architecture that leverages open-source tools for speed and accuracy.

---

# Backend Architecture — What You Need

Your backend has **five layers**, each with proven open-source tools so you don't reinvent the wheel. The pipeline is: **Geospatial → Vulnerability → Financial Engine → AI Layer → API**.

---

## 1. Geospatial & Hazard Processing Layer

This layer reads your raster files (Nairobi proxy tiers, Nzoia JRC depth maps), looks up building coordinates, and extracts hazard values.

| Tool | What it does | Why use it | Link |
|---|---|---|---|
| **Rasterio** | Reads/writes GeoTIFF files, extracts cell values at lat/lon coordinates | The standard Python library for raster I/O; GDAL-backed | `https://rasterio.readthedocs.io/` |
| **xarray-spatial** | 100+ raster analysis functions: surface analysis, hydrology (D8, D-infinity), flood modeling | Built on xarray; handles large rasters efficiently | `https://xarray-spatial.readthedocs.io/` |
| **GeoPandas** | Vector operations: building points, hotspot points, spatial joins | Extends pandas with geometry; essential for exposure-hazard joins | `https://geopandas.org/` |
| **rioxarray** | Combines Rasterio + xarray; clips, reprojects, samples rasters | Best for clipping hazard rasters to Nairobi/Nzoia extent | `https://corteva.github.io/rioxarray/` |
| **Shapely** | Geometric operations: point-in-polygon, buffers, intersections | Foundation for spatial queries | `https://shapely.readthedocs.io/` |

**What you build**: A function `lookup_hazard(lat, lon, tier)` that opens the correct `.tif` file, finds the cell containing the coordinate, and returns the hazard value (or `0` for dry, or handles Nzoia's no-data value `-3.4e38`).

---

## 2. Vulnerability / Damage Function Layer

This layer converts hazard severity (0–1 score for Nairobi, depth in metres for Nzoia) into a **damage ratio** per housing class.

| Tool | What it does | Why use it | Link |
|---|---|---|---|
| **Delft-FIAT** | Fast, Python-based flood damage assessment; depth-damage functions for buildings, utilities, roads | Developed by Deltares; handles any damage type describable by a depth-damage function | `https://github.com/Deltares/Delft-FIAT` |
| **DamageScanner** | Direct damage assessments for natural hazards; based on Dutch depth-damage curves | Loosely based on the original DamageScanner; Python toolkit | `https://github.com/VU-IVM/DamageScanner` |
| **pyINSYDE** | Python port of the INSYDE flood damage model; synthetic damage model using mechanistic building representation | Estimates repair/recovery costs; avoids simple deterministic DDFs | `https://github.com/vsrikrish/pyINSYDE` |
| **UNSAFE** | Adds parametric uncertainty to depth-damage relationships; estimates flood losses | Useful if you want to show uncertainty bands on your vulnerability curves | `https://github.com/abpoll/unsafe` |
| **HAZUS Flood** (via SPHERE) | FEMA's HAZUS flood risk methodology on GeoParquet and DuckDB | Open-source Python package; production-grade methodology | `https://github.com/SPHERE-Flood` |

**What you build**: A function `damage_ratio(housing_class, hazard_value)` that applies a sigmoid curve (or piecewise linear) calibrated from JRC/Huizinga curves, with separate parameters per housing class (informal_iron_sheet, semi_permanent, permanent_masonry, concrete_rcc).

---

## 3. Financial Engine & EP Curve Layer

This layer multiplies damage ratio × TIV per building, aggregates across the portfolio, and produces the **Exceedance Probability (EP) curve**.

| Tool | What it does | Why use it | Link |
|---|---|---|---|
| **catagg** | Catastrophe loss aggregation: event loss tables → net EP curves; simulates year-loss tables | Directly builds gross/net EP curves; applies reinsurance structures | `pip install catagg` |
| **catmodeling** | Manipulates catastrophe model outputs: simulates YLTs from ELTs, applies hours clauses, calculates AAL and EP curves | Python implementation of established cat modelling methodology | `pip install catmodeling` |
| **CLIMADA** | Probabilistic climate-risk assessment; computes expected annual damage, EP curves, event-by-event losses | ETH Zurich-led; fully open source; handles river flood, tropical cyclones, drought | `https://github.com/CLIMADA-project/climada_python` |
| **GenMR** | Probabilistic Generic Multi-Risk framework; AAL, EP curves, multi-risk simulations | Parameterizable virtual environment; research-grade | `https://github.com/MignanRiskAnalytics/GenMR_SCOR` |
| **Oasis LMF** | Full catastrophe modelling platform: runs models, produces ELT, PLT, EPT (EP tables) | Industry standard; BSD-3 licensed; Python-based | `https://github.com/OasisLMF` |

**What you build**: A function `compute_portfolio_loss(scenario)` that loops over all buildings, applies vulnerability, sums losses, and returns portfolio loss. Then `compute_ep_curve()` that runs this across all return periods / tiers and sorts losses to build the curve.

**Recommendation for hackathon speed**: Use **catagg** or **catmodeling** for the EP curve — they're lightweight and purpose-built. CLIMADA is powerful but heavier; use it if you want built-in hazard data APIs.

---

## 4. AI Intelligence Layer

This is your required differentiator. The AI must **materially change the output**, not just describe it.

| Tool | What it does | Why use it | Link |
|---|---|---|---|
| **OpenAI API / Azure OpenAI** | LLM for free-text exposure parsing, natural-language briefings, vulnerability research | Fastest to integrate; pay-per-use | `https://platform.openai.com/` |
| **LangChain** | Framework for chaining LLM calls with tools, structured output, memory | Parses free-text into structured rows; orchestrates multi-step AI workflows | `https://github.com/langchain-ai/langchain` |
| **Instructor** | Structured output from LLMs using Pydantic models | Forces LLM to return valid JSON matching your exposure schema | `https://github.com/jxnl/instructor` |
| **Ollama** | Run open-source LLMs locally (Llama 3, Mistral) | No API costs; data stays local; good for demos | `https://ollama.com/` |
| **H2O.ai Flood Intelligence Blueprint** | Hybrid multi-agent architecture for flood intelligence; NVIDIA NeMo + h2oGPTe | Production-grade AI orchestration for flood risk | `https://h2o.ai/` |

**What you build**:
- **Free-text parser**: `parse_portfolio("12 iron-sheet shops near the river in Dandora")` → returns structured rows matching your exposure CSV schema.
- **Risk briefing**: `generate_briefing(model_output)` → LLM produces a plain-English underwriter summary.
- **Hazard signal discovery**: LLM reasons about which additional signals (drainage reports, informal settlement boundaries) would improve the proxy.

---

## 5. API & Backend Framework Layer

This layer exposes your pipeline as an API that the frontend dashboard consumes.

| Tool | What it does | Why use it | Link |
|---|---|---|---|
| **FastAPI** | Modern, fast Python web framework for building APIs; auto-generates OpenAPI docs | Async support; ideal for geospatial endpoints returning GeoJSON | `https://fastapi.tiangolo.com/` |
| **Uvicorn** | ASGI server for FastAPI | High-performance; production-ready | `https://www.uvicorn.org/` |
| **Pydantic** | Data validation using Python type hints | Validates exposure CSV uploads, API request/response schemas | `https://docs.pydantic.dev/` |
| **Streamlit** | Rapid dashboard framework (alternative to custom frontend) | If you want to skip frontend entirely, Streamlit can render maps, charts, and tables directly from Python | `https://streamlit.io/` |
| **Redis Queue (RQ)** | Background job processing | For long-running model runs; avoids blocking API responses | `https://python-rq.org/` |
| **PostgreSQL + PostGIS** | Spatial database (optional) | If you need to store/query exposure portfolios persistently | `https://postgis.net/` |

**What you build**: REST endpoints:
- `POST /api/run-model` — runs pipeline for a scenario
- `GET /api/ep-curve` — returns EP curve data
- `POST /api/upload-exposure` — accepts CSV, validates, stores
- `POST /api/ai/parse-portfolio` — free-text → structured rows
- `POST /api/ai/briefing` — generates risk briefing

---

## Recommended Minimum Stack (for 3-day build)

| Layer | Tool | Why |
|---|---|---|
| Geospatial | **Rasterio + GeoPandas** | Read rasters, join exposure points |
| Vulnerability | **Custom sigmoid function** (calibrated from JRC curves) | Simpler than Delft-FIAT for a hackathon |
| Financial Engine | **catagg** or **catmodeling** | Built-in EP curve generation |
| AI Layer | **OpenAI API + Instructor** | Structured output; fastest integration |
| API | **FastAPI + Uvicorn** | Async, auto-docs, GeoJSON support |
| Dashboard | **Streamlit** or **Next.js + React** | Streamlit for speed; Next.js for the polished UI you described earlier |

---

## Backend Flow — How It All Connects

```
┌─────────────────────────────────────────────────────────────────────┐
│  POST /api/run-model  { scenario: "moderate" }                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  1. Geospatial Layer (Rasterio + GeoPandas)                         │
│     - Load exposure CSV (600 Nairobi buildings)                     │
│     - For each building, look up hazard score in tier raster        │
│     - Return DataFrame: [loc_id, lat, lon, housing_class,           │
│                           tiv_kes, hazard_score]                    │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  2. Vulnerability Layer (Custom sigmoid per housing class)          │
│     - For each building: damage_ratio = f(hazard_score, class)      │
│     - Return DataFrame with damage_ratio column                     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  3. Financial Engine (catagg / catmodeling)                         │
│     - loss = damage_ratio × tiv_kes                                 │
│     - Sum losses → portfolio loss for scenario                      │
│     - Repeat across all tiers → EP curve                            │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  4. AI Layer (OpenAI + Instructor)                                  │
│     - Optional: generate briefing from model output                 │
│     - Optional: parse free-text portfolio into structured rows      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  5. API Response (FastAPI)                                          │
│     {                                                               │
│       "total_tiv": 6363470000,                                      │
│       "loss_at_100y": 29353634,                                     │
│       "ep_curve": [...],                                            │
│       "loss_by_class": {...},                                       │
│       "briefing": "..."                                             │
│     }                                                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Repositories to Clone Immediately

| Repo | Command |
|---|---|
| Oasis LMF | `git clone https://github.com/OasisLMF/OasisLMF` |
| CLIMADA | `git clone https://github.com/CLIMADA-project/climada_python` |
| Delft-FIAT | `git clone https://github.com/Deltares/Delft-FIAT` |
| catagg | `pip install catagg` |
| catmodeling | `pip install catmodeling` |
| DamageScanner | `git clone https://github.com/VU-IVM/DamageScanner` |
| pyINSYDE | `git clone https://github.com/vsrikrish/pyINSYDE` |

---

## Summary — What You Need to Build vs. What You Reuse

| You Build | You Reuse |
|---|---|
| Exposure CSV loader | Rasterio for raster reading |
| Hazard lookup function | GeoPandas for spatial join |
| Vulnerability curve (calibrated from JRC) | Delft-FIAT or pyINSYDE for curve structure |
| Financial engine aggregation | catagg or catmodeling for EP curve |
| AI parser prompt + schema | LangChain/Instructor for structured output |
| API endpoints | FastAPI for web framework |
| Dashboard frontend | Streamlit or Next.js + React |

This stack lets you focus on **modeling rigour and AI integration** — the things judges actually score — rather than rebuilding geospatial I/O, EP curve math, or API boilerplate.