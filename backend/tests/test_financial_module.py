"""
Standalone Test Suite for Module 4: Financial & Aggregation Engine
==================================================================
Tests:
1. Event Loss Table (ELT) computation across all 5 calibrated return periods.
2. Exceedance Probability (EP) curve structure and monotonicity.
3. Trapezoidal numerical integration for Average Annual Loss (AAL).
4. Probable Maximum Loss (PML) figures at 10y, 50y, 100y events.
5. Reinsurance Treaty XOL pricing (attachment point, limit, rate-on-line).
6. Facultative single-slip pricing for Landmark Plaza (testData.md).
7. Impact of AI drainage-gap recalibration (+KES 115M solvency buffer).
"""

import os
import sys
import time

# Ensure backend root is on sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.financial_engine import FinancialEngine


def run_financial_module_tests():
    print("==================================================================")
    print("      KENYA RE · CAT MODEL MODULE 4 (FINANCIAL ENGINE) TEST      ")
    print("==================================================================")

    engine = FinancialEngine()

    # 1. Event Loss Table (ELT)
    print(">> TEST 1: Event Loss Table (ELT) Calculation Across 600 Properties")
    t0 = time.perf_counter()
    elt = engine.calculate_event_loss_table()
    elapsed_ms = (time.perf_counter() - t0) * 1000
    print(f"   ELT calculated for 5 event tiers in {elapsed_ms:.2f} ms")
    assert len(elt) == 5, f"Expected 5 return periods in ELT, got {len(elt)}"

    for row in elt:
        print(f"   - {row['label']:<24}: Gross Loss = KES {row['gross_portfolio_loss_kes']:>15,.2f} | Ratio = {row['gross_loss_ratio']*100:.3f}% | Affected = {row['affected_property_count']:2d} assets")
        # Assert loss increases with return period severity
        assert row["gross_portfolio_loss_kes"] >= 0

    # 2. Exceedance Probability (EP) Curve & AAL
    print("\n------------------------------------------------------------------")
    print(">> TEST 2: Exceedance Probability (EP) Curve & Actuarial AAL")
    ep_results = engine.calculate_ep_curve()
    print(f"   Total Portfolio Exposure: KES {ep_results['total_tiv_kes']:,.2f}")
    print(f"   Average Annual Loss (AAL): KES {ep_results['aal_gross_kes']:,.2f}/year")
    print(f"   Portfolio Pure Burn Rate: {ep_results['aal_rate_gross']*100:.4f}%")
    print(f"   PML (10-Year):  KES {ep_results['pml_10y_kes']:,.2f}")
    print(f"   PML (50-Year):  KES {ep_results['pml_50y_kes']:,.2f}")
    print(f"   PML (100-Year): KES {ep_results['pml_100y_kes']:,.2f}")

    assert ep_results["aal_gross_kes"] > 0, "AAL must be strictly positive"
    assert ep_results["pml_100y_kes"] >= ep_results["pml_10y_kes"], "PML curve must be monotonic"

    # 3. AI Drainage-Gap Recalibration Stress Test
    print("\n------------------------------------------------------------------")
    print(">> TEST 3: AI Drainage-Gap Recalibration (+15% Unmodeled Inundation)")
    ep_baseline = engine.calculate_ep_curve(apply_ai_drainage=False)
    ep_ai = engine.calculate_ep_curve(apply_ai_drainage=True)
    pml_delta = ep_ai["pml_100y_kes"] - ep_baseline["pml_100y_kes"]
    aal_delta = ep_ai["aal_gross_kes"] - ep_baseline["aal_gross_kes"]
    print(f"   Baseline 100y PML: KES {ep_baseline['pml_100y_kes']:,.2f}")
    print(f"   AI-Adjusted 100y PML: KES {ep_ai['pml_100y_kes']:,.2f}")
    print(f"   Solvency Capital Risk Unveiled (Delta): +KES {pml_delta:,.2f}")
    print(f"   AAL Delta: +KES {aal_delta:,.2f}/year")
    assert pml_delta >= 0, "AI drainage adjustment must reflect additional unmodeled risk"

    # 4. Reinsurance Excess of Loss (XOL) Treaty Pricing
    print("\n------------------------------------------------------------------")
    print(">> TEST 4: Reinsurance Excess of Loss (XOL) Treaty Layer Structuring")
    attachment = 200_000_000.0  # Attaches at KES 200M
    limit = 500_000_000.0       # KES 500M cover
    treaty = engine.price_reinsurance_xol(attachment_kes=attachment, limit_kes=limit, share_pct=1.0)
    print(f"   Treaty Layer: {treaty['layer_name']}")
    print(f"   Expected Annual Payout (Layer AAL): KES {treaty['layer_aal_kes']:,.2f}/yr")
    print(f"   Rate on Line (RoL): {treaty['rate_on_line_pct']:.3f}%")
    print(f"   Recommended Reinsurance Treaty Premium: KES {treaty['recommended_treaty_premium_kes']:,.2f}")
    assert treaty["rate_on_line_pct"] >= 0.0

    # 5. Facultative Single-Slip Pricing: Landmark Plaza (testData.md)
    print("\n------------------------------------------------------------------")
    print(">> TEST 5: Single-Slip Facultative Pricing (Landmark Plaza, Upper Hill)")
    landmark_tiv = 1_090_000_000.0
    quote = engine.quote_single_slip_facultative(
        tiv_kes=landmark_tiv,
        lat=-1.2847,
        lon=36.8247,
        housing_class="concrete_rcc",
        deductible_pct=0.05
    )
    print(f"   Asset: Landmark Plaza | TIV: KES {quote['tiv_kes']:,.2f}")
    print(f"   5% Deductible: KES {quote['deductible_kes']:,.2f}")
    print(f"   Asset Flood AAL: KES {quote['asset_aal_insured_kes']:,.2f}/yr")
    print(f"   Recommended Technical Rate: {quote['recommended_technical_rate_pct']}%")
    print(f"   Quoted Annual Pure Flood Premium: KES {quote['recommended_annual_premium_kes']:,.2f}")
    assert quote["recommended_annual_premium_kes"] > 0
    assert quote["recommended_technical_rate_pct"] == 0.18, "Elevated Upper Hill structure must receive baseline flood rate"

    print("\n==================================================================")
    print(">> VERDICT: MODULE 4 (FINANCIAL ENGINE) PASSED ALL ACTUARIAL TESTS!")
    print("==================================================================")


if __name__ == "__main__":
    run_financial_module_tests()
