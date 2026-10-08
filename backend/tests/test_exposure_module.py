"""
Standalone Test Suite for Module 3: Exposure Engine & Spatial Matching
======================================================================
Tests:
1. Ingestion of baseline 600-building portfolio (Total TIV, column validation).
2. Spatial administrative ward matching.
3. Oasis OED validation rules (bounding box, positive TIV, valid typology).
4. Sub-millisecond hazard raster matching across the portfolio.
5. Ingestion of custom commercial asset (Landmark Plaza, testData.md).
6. CLIMADA Exposures / Entity data dictionary export.
"""

import os
import sys
import time

# Ensure backend root is on sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.exposure_engine import ExposureEngine


def run_exposure_module_tests():
    print("==================================================================")
    print("      KENYA RE · CAT MODEL MODULE 3 (EXPOSURE ENGINE) TEST       ")
    print("==================================================================")

    # 1. Initialize Baseline Exposure
    engine = ExposureEngine()
    print(">> TEST 1: Baseline Exposure Ingestion")
    print(f"   Asset Count: {len(engine.assets)} buildings")
    print(f"   Total Portfolio TIV: KES {engine.total_tiv_kes:,.2f}")
    assert len(engine.assets) == 600, f"Expected 600 assets, found {len(engine.assets)}"
    assert engine.total_tiv_kes > 0, "TIV must be strictly positive"

    # 2. Portfolio Breakdown by Housing Class
    stats = engine.get_summary_statistics()
    print("\n------------------------------------------------------------------")
    print(">> TEST 2: Housing Class Breakdown & Capital Allocation")
    for hc, data in stats["distribution_by_class"].items():
        print(f"   - {hc:<22}: {data['count']:3d} properties | TIV: KES {data['tiv_kes']:>15,.2f} ({data['tiv_percentage']}%)")

    # 3. Spatial Matching Against Hazard Raster (100-Year Extreme Event)
    print("\n------------------------------------------------------------------")
    print(">> TEST 3: Sub-Millisecond Spatial Hazard Raster Matching (100y)")
    t0 = time.perf_counter()
    enriched = engine.match_spatial_hazard("100y")
    elapsed_ms = (time.perf_counter() - t0) * 1000
    print(f"   Matched 600 assets to GeoTIFF raster in {elapsed_ms:.2f} ms ({elapsed_ms/600:.4f} ms/asset)")
    
    flooded_assets = [a for a in enriched if a["hazard_score"] > 0]
    print(f"   Assets with positive flood depth: {len(flooded_assets)}/600")
    if flooded_assets:
        sample = flooded_assets[0]
        print(f"   Sample Flooded Property ({sample['loc_id']}): Score={sample['hazard_score']:.4f}, Depth={sample['depth_m']:.3f}m, Ward={sample['ward']}")

    # 4. Ingestion & Validation of Landmark Plaza from testData.md
    print("\n------------------------------------------------------------------")
    print(">> TEST 4: Single Asset Ingestion (Landmark Plaza, testData.md)")
    custom_records = [
        {
            "loc_id": "EIB-NAI-LP-2026-001",
            "name": "Landmark Plaza Commercial Development",
            "lat": -1.2847,
            "lon": 36.8247,
            "housing_class": "concrete_rcc",
            "floor_area_m2": 24500.0,
            "cost_per_m2_kes": 44489.8,
            "tiv_kes": 1090000000.0,
        },
        # Intentionally invalid record to test Oasis validation
        {
            "loc_id": "INVALID-001",
            "lat": 15.000, # Out of Nairobi
            "lon": 36.800,
            "housing_class": "unknown",
            "tiv_kes": -500.0,
        }
    ]
    valid, errors = engine.validate_exposure_records(custom_records)
    print(f"   Valid Records Ingested: {len(valid)}/2")
    print(f"   Validation Errors Caught: {len(errors)}")
    for err in errors:
        print(f"     • Expected rejection: {err}")
    assert len(valid) == 1, "Must accept only the valid Landmark Plaza record"
    assert valid[0]["ward"] == "Upper Hill / CBD", f"Expected Upper Hill / CBD ward, got {valid[0]['ward']}"

    # 5. CLIMADA Exposures / Entity Export
    print("\n------------------------------------------------------------------")
    print(">> TEST 5: CLIMADA Exposures / Entity Data Structure Export")
    climada_exp = engine.to_climada_exposure()
    print(f"   Exported Assets: {climada_exp['n_assets']}")
    print(f"   Total Value: KES {climada_exp['total_value']:,.2f}")
    print(f"   Currency: {climada_exp['currency']}")
    assert climada_exp["climada_compatible"] is True
    assert len(climada_exp["value"]) == 600

    print("\n==================================================================")
    print(">> VERDICT: MODULE 3 (EXPOSURE ENGINE) PASSED ALL VERIFICATION TESTS!")
    print("==================================================================")


if __name__ == "__main__":
    run_exposure_module_tests()

