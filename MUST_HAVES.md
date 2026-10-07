# Kenya Re AI4I Hackathon 2026: Mandatory Deliverables & Evaluation Checklist
**Track:** Team A · Nairobi Urban Flood Catastrophe Model  
**Focus:** Urban Surface-Water (Pluvial) Flooding in Nairobi  
**Target Audience:** Underwriters, Risk Analysts, Portfolio Managers, and Hackathon Judges  

---

## Executive Summary: What *Must* Be Seen Working

To win and satisfy the judging rubric, the prototype cannot just be a slide deck, a static script, or a generic chatbot. It must be a **fully functioning, end-to-end Catastrophe (CAT) Model** with an interactive dashboard that a non-technical underwriter can understand in **under 2 minutes**.

```
┌─────────────────┐     ┌───────────────────────┐     ┌───────────────────────┐
│  Hazard Engine  │ ──> │ Vulnerability Engine  │ ──> │    Exposure Engine    │
│  (5 Tiers / RP) │     │ (Depth-Damage Curves) │     │ (600 Properties / TIV)│
└─────────────────┘     └───────────────────────┘     └───────────────────────┘
                                                                  │
                                                                  ▼
┌─────────────────────────┐     ┌───────────────────────┐     ┌───────────────────────┐
│   Results Dashboard     │ <── │ AI Intelligence Layer │ <── │   Financial Engine    │
│ (EP Curve, Maps, Brief) │     │ (Material Impact)     │     │ (Loss, AAL, PML)      │
└─────────────────────────┘     └───────────────────────┘     └───────────────────────┘
```

---

## 1. Pillar 1: Hazard Pipeline (Must-Haves)

- [ ] **Ingest the 5 Hazard Tiers**:
  - Must handle all five severity tiers: `common`, `occasional`, `moderate`, `severe`, and `extreme`.
  - Must accept either the pre-extracted values from [`exposure_nairobi_with_hazard.csv`](file:///c:/Users/musiliandrew/OneDrive/Desktop/KenyaRE/team_a_nairobi/team_a_nairobi/exposure_nairobi_with_hazard.csv) or sample directly from the 5 GeoTIFF rasters (`nairobi_pluvial_proxy_*.tif`).
- [ ] **Explicit Return Period ($T$) Mapping**:
  - The dataset gives names, not years. The model **must explicitly state** the return period assumptions:
    - `common` $\rightarrow$ 1-in-5 Year ($P = 0.20$)
    - `occasional` $\rightarrow$ 1-in-10 Year ($P = 0.10$)
    - `moderate` $\rightarrow$ 1-in-25 Year ($P = 0.04$)
    - `severe` $\rightarrow$ 1-in-50 Year ($P = 0.02$)
    - `extreme` $\rightarrow$ 1-in-100 Year ($P = 0.01$)
- [ ] **Hazard Score Interpretation (0.0 to 1.0)**:
  - Must defend how the 0–1 score is translated:
    - *Option A (Recommended):* Converted to effective flood depth in meters ($\text{Depth} = \text{Score} \times \text{Max Depth}_{T}$).
    - *Option B:* Direct parametric severity tiers.
- [ ] **Honest Hotspot Validation & Limitation Statement**:
  - Must acknowledge against [`nairobi_hotspots_geocoded.csv`](file:///c:/Users/musiliandrew/OneDrive/Desktop/KenyaRE/team_a_nairobi/team_a_nairobi/nairobi_hotspots_geocoded.csv) that the terrain proxy captures 12/24 hotspots, but misses 12 (e.g. Kibera, Westlands, Lavington) due to man-made drainage infrastructure failures.

---

## 2. Pillar 2: Vulnerability / Damage Functions (Must-Haves)

- [ ] **Construction-Specific Depth-Damage Curves**:
  - Must provide distinct vulnerability functions for the 3 housing classes present in the data:
    1. `informal_iron_sheet`: Steep curve, high damage at low depths ($0.2\text{m} - 0.5\text{m}$).
    2. `semi_permanent`: Moderate curve with progressive damage.
    3. `permanent_masonry`: Resilient curve, low damage until higher thresholds.
- [ ] **Defensible Curve Shape**:
  - Must exhibit realistic physical characteristics (Sigmoid / S-curve):
    - Zero/negligible damage at near-zero depth.
    - Steep escalation in mid-depths ($0.5\text{m} - 1.5\text{m}$).
    - Damage cap between **80% and 95%** (land and foundations do not vanish).
- [ ] **Documented Reference Source**:
  - Must cite the **JRC / Huizinga et al.** global flood damage framework as the baseline reference, noting any local adjustments made for Nairobi conditions.

---

## 3. Pillar 3: Exposure Portfolio (Must-Haves)

- [ ] **Full Ingestion of Synthetic Portfolio**:
  - Must ingest the 600 synthetic locations with their coordinates, `housing_class`, `floor_area_m2`, `cost_per_m2_kes`, and `tiv_kes`.
- [ ] **Labeling Requirements**:
  - Must clearly label all portfolio data as **Synthetic / Not real client policies** in the interface to satisfy underwriting compliance requirements.
- [ ] **Spatial Accumulation Analysis**:
  - Must calculate and visualize where Total Insured Value (TIV) is spatially concentrated across Nairobi sub-regions.

---

## 4. Pillar 4: Financial Engine (Must-Haves)

- [ ] **Property-Level Loss Calculation**:
  - For each building $i$ across each hazard tier $T$:
    $$\text{Loss}_{i, T} = \text{TIV}_i \times \text{Damage Ratio}(d_{i, T}, \text{class}_i)$$
- [ ] **Portfolio-Level Aggregation**:
  - Sum individual property losses for each return period tier to produce total event losses.
- [ ] **Exceedance Probability (EP) Curve**:
  - Must plot the Loss vs. Return Period ($T$) and Annual Exceedance Probability ($1/T$).
  - Must allow underwriters to quickly read expected losses at 10-year, 25-year, 50-year, and 100-year events.
- [ ] **Key Reinsurance Metrics**:
  - **AAL (Average Annual Loss)**: Expected annualized portfolio loss (area under the EP curve).
  - **PML (Probable Maximum Loss)**: Peak loss at extreme return periods (1-in-100 year).

---

## 5. Pillar 5: AI Intelligence Layer (Mandatory Differentiator)

> **Judging Requirement:** The AI component *must materially change the output* or inputs of the model—not simply generate text describing numbers already calculated.

Must implement at least one (or a hybrid) of the following:

- [ ] **Option A: AI Drainage-Gap Correction (Geospatial ML)**:
  - Train an ML model / spatial intelligence heuristic to learn flood risk adjustments for the 12 missed drainage hotspots (e.g. Kibera, Westlands), recalculating hazard scores and showing the financial difference in portfolio loss before vs. after AI correction.
- [ ] **Option B: Free-Text Underwriting Intake (NLP Extraction Engine)**:
  - Allow an underwriter to type or paste unstructured policy text (e.g., *"Insuring 5 masonry commercial stores in Westlands each 150m2, KES 45,000/m2, and 10 iron sheet units in Mathare"*).
  - The AI parses the text into structured schema, geocodes them, runs them through the hazard & vulnerability engines, and computes instant financial losses.
- [ ] **Option C: Generative Reinsurance Treaty & Underwriting Briefing**:
  - An AI engine that synthesizes the EP curve, portfolio accumulation hotspots, and extreme event losses into a formal executive underwriting memo with actionable pricing and risk-mitigation recommendations.

---

## 6. Pillar 6: Results Interface / Dashboard (Must-Haves)

The interface must be designed for an **underwriter or judge** to grasp within **2 minutes**:

- [ ] **Key Metric Scorecards**:
  - Total Insured Value (TIV in KES)
  - 10-year Loss, 50-year Loss, 100-year Loss (KES and % of TIV)
  - Average Annual Loss (AAL in KES)
- [ ] **Interactive Visualizations**:
  - **EP Curve (Exceedance Probability)**: Interactive Plotly chart with return periods.
  - **Nairobi Flood Risk Map**: Map showing property locations colored by hazard intensity / expected loss, with hotspot markers.
  - **Exposure & Vulnerability Breakdown**: Bar/pie charts showing loss distribution across the 3 housing classes.
  - **Vulnerability Curves Visualizer**: Plot showing the damage functions across water depths for iron sheet vs. semi-permanent vs. masonry.
- [ ] **Interactive AI Feature Tab**:
  - Dedicated interactive section demonstrating the AI feature working live.
- [ ] **Transparency / Assumptions Sidebar**:
  - Clear toggle or panel explicitly listing what is real data vs. synthetic data vs. modeling assumptions.

---

## 7. Submission Deliverables Checklist

- [ ] **Working Software Prototype**: Standalone executable dashboard (e.g. `streamlit run app.py`).
- [ ] **Clean Codebase Structure**:
  - `hazard.py` (Hazard ingestion, return period mapping, depth conversion)
  - `vulnerability.py` (JRC-adapted depth-damage functions for 3 housing classes)
  - `financial_engine.py` (Loss computation, EP curve, AAL, PML)
  - `ai_layer.py` (ML drainage enhancement or NLP policy parser)
  - `app.py` (Streamlit interactive dashboard)
- [ ] **Written Technical Note (`SUBMISSION_NOTE.md`)**:
  - Data sources cited.
  - Explicit explanation of all assumptions.
  - Explanation of how AI materially changes the model output.
  - Honest disclosure of model limitations.

