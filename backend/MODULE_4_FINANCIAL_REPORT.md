# Kenya Re Catastrophe Risk Intelligence Platform
# Engineering Report: Module 4 — Financial Engine, Portfolio Aggregation & Reinsurance Layer
**Organization:** Kenya Reinsurance Corporation  
**Challenge Track:** Team A — Nairobi Urban Surface-Water (Pluvial) Flood Model  
**Date:** October 8, 2026  
**Status:** Completed, Verified, and Integrated  

---

## 1. Executive Summary

Module 4 implements the actuarial and financial core of the catastrophe modeling pipeline. It bridges physical hazard intensity (Module 1), structural vulnerability functions (Module 2), and exposure portfolios (Module 3) into balance-sheet risk metrics.

The Financial Engine computes:
1. **Event Loss Tables (ELT):** Gross and insured loss distribution across all 5 calibrated return periods.
2. **Exceedance Probability (EP) Curves:** Discrete event loss curve and 90% confidence tail bands.
3. **Average Annual Loss (AAL):** Continuous loss expectation calculated via numerical trapezoidal integration.
4. **AI Drainage-Gap Solvency Stress:** Quantitative impact of unmodeled infrastructure blockages on solvency capital.
5. **Reinsurance Excess of Loss (XOL) Treaty Pricing:** Attachment, limit, layer payout, Rate on Line (RoL), and pure risk premium.
6. **Single-Slip Facultative Flood Pricing:** Underwriting quotes and technical rates for individual commercial and residential risks (e.g. Landmark Plaza).

---

## 2. Actuarial Formulations & Implementation

### 2.1 Event Loss Table (ELT)
For each return period $T \in \{5, 10, 25, 50, 100\}$ with annual exceedance probability $p = 1 / T$:
1. For each asset $i$, the pluvial flood depth $d_{i, T}$ is sampled from the corresponding calibrated GeoTIFF raster.
2. If AI drainage adjustments are activated, an unmodeled blockage surcharge is applied to low-elevation hotspots:
   $$d_{i, T}^{\text{eff}} = d_{i, T} + \Delta d_{\text{drainage}}$$
3. Structural damage ratio $DR_{i}$ is calculated via the Module 2 JRC continuous vulnerability curve:
   $$L_{i}^{\text{gross}} = TIV_i \times DR_i(d_{i, T})$$
4. Policy deductible retention $D_i = TIV_i \times \delta$ is applied:
   $$L_i^{\text{insured}} = \max\left(0, L_i^{\text{gross}} - D_i\right)$$
5. Portfolio aggregation yields the total event loss:
   $$L_T = \sum_{i=1}^{N} L_{i, T}$$

### 2.2 Numerical Trapezoidal Integration for AAL
The Average Annual Loss is mathematically defined as the integral of the EP curve over exceedance probability $p \in [0, 1]$:
$$\text{AAL} = \int_{0}^{1} L(p) \, dp$$

Given discrete probability anchor points $(p_1, L_1), (p_2, L_2), \dots, (p_K, L_K)$, numerical integration is computed via trapezoidal summation:
$$\text{AAL} = \sum_{k=1}^{K-1} \frac{L(p_k) + L(p_{k+1})}{2} \cdot (p_k - p_{k+1}) + p_K \cdot L(p_K)$$
Where the final term represents the conservative tail contribution beyond the 100-year event ($p_K = 0.01$).

### 2.3 Excess of Loss (XOL) Reinsurance Treaty Structuring
For a treaty layer attaching at $A$ with limit $M$ and reinsurer share $\alpha$:
$$\text{Payout}_T = \alpha \cdot \min\left(M, \max(0, L_T - A)\right)$$
$$\text{Layer AAL} = \int_{0}^{1} \text{Payout}(p) \, dp$$
$$\text{Rate on Line (RoL)} = \frac{\text{Layer AAL}}{M}$$
$$\text{Commercial Treaty Premium} = \text{Layer AAL} \times (1 + \mu_{\text{capital}} + \mu_{\text{expense}})$$
where $\mu_{\text{capital}} = 0.35$ and $\mu_{\text{expense}} = 0.15$ (standard 1.50 multiplier).

---

## 3. Baseline Portfolio Actuarial Findings (600 Properties, KES 63.64B TIV)

### 3.1 Event Loss Table & Probable Maximum Loss (PML)

| Return Period | Annual Prob ($p$) | Hazard Proxy | Gross Portfolio Loss (KES) | Loss Ratio (%) | Impacted Assets |
|---|---|---|---|---|---|
| **5-Year** | 0.200 | Common Pluvial | KES 6,527,608.00 | 0.010% | 27 |
| **10-Year** | 0.100 | Moderate Pluvial | KES 48,062,092.50 | 0.075% | 30 |
| **25-Year** | 0.040 | Occasional Pluvial | KES 159,456,174.50 | 0.251% | 82 |
| **50-Year** | 0.020 | Severe Pluvial | KES 130,957,828.50 | 0.206% | 30 |
| **100-Year** | 0.010 | Extreme Pluvial | **KES 164,714,571.50** | **0.259%** | 23 |

- **100-Year Probable Maximum Loss (PML 100):** **KES 164.71 Million**
- **Average Annual Loss (AAL):** **KES 14,984,680.78 / year** (~KES 14.98M)
- **Portfolio Pure Burn Rate:** **0.0235%** (2.35 basis points)

### 3.2 AI Drainage-Gap Solvency Stress Test (+15% Unmodeled Inundation)

When simulating blocked culverts and rapid urban sediment silting:
- **Baseline 100-Year PML:** KES 164,714,571.50
- **AI-Adjusted 100-Year PML:** **KES 199,427,438.00**
- **Unmodeled Capital Risk Unveiled (Delta):** **+KES 34,712,866.50 (+21.1%)**
- **AAL Expansion:** From KES 14.98M/yr to **KES 21.55M/yr (+KES 6.57M/yr)**

*Executive Insight:* Traditional models that neglect Nairobi's pluvial drainage choke-points underestimate Kenya Re's capital requirements by over **KES 34.7 Million** in a 100-year storm event.

### 3.3 Reinsurance Treaty Layer Evaluation (KES 100M xs KES 50M)

For a primary cedant layer of **KES 100,000,000 xs KES 50,000,000**:
- **Layer AAL (Pure Expected Payout):** **KES 6,714,367.43 / year**
- **Rate on Line (RoL):** **6.714%**
- **Recommended Treaty Premium:** **KES 10,071,551.14** (including risk margin)
- **Exhaustion Triggers:** Triggers at 25-Year and 100-Year pluvial events.

### 3.4 Single-Slip Facultative Quote (Landmark Plaza, Upper Hill)

Evaluation for Landmark Plaza (`testData.md`, Upper Hill, TIV KES 1.09B, Reinforced Concrete):
- **100-Year Inundation Depth:** 0.00 m (Topographic ridge location)
- **Asset Pure Flood AAL:** KES 0.00 / year
- **Recommended Technical Flood Rate:** 0.180% (Elevated commercial minimum loading)
- **Quoted Annual Flood Premium:** **KES 1,962,000.00**
- **Policy Deductible (5%):** KES 54,500,000.00

---

## 4. Test Suite & Verification Results

The automated test suite (`backend/tests/test_financial_module.py`) executed all five test cases:
1. `test_event_loss_table`: Evaluated 600 properties across 5 event tiers in **21.11 ms**.
2. `test_ep_curve_and_aal`: Verified trapezoidal AAL calculation (KES 14.98M/yr) and PML extraction.
3. `test_ai_drainage_impact`: Verified positive delta (+KES 34.71M in 100y PML).
4. `test_reinsurance_xol_pricing`: Verified treaty layer pricing and Rate on Line calculation.
5. `test_single_slip_facultative_quote`: Verified Landmark Plaza Upper Hill underwriting quote.

All test suites and FastAPI `TestClient` integrations passed with 100% compliance.

---

## 5. API Endpoints Delivered
- `GET /api/curves/ep`: Full Exceedance Probability curve, PMLs, and trapezoidal AAL with AI toggle.
- `POST /api/reinsurance/xol`: Pricing engine for Excess of Loss Reinsurance treaties.
- `POST /api/quotes/facultative`: Technical underwriting quotation for single policy slips.
- `POST /api/model/run`: Full scenario catastrophe run with AI delta and damage breakdown.
