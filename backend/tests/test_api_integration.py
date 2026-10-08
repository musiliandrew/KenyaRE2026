"""
Kenya Re CAT Platform - API integration test.
Hits every endpoint the frontend consumes and asserts values come from the real engines.
Run: python backend/tests/test_api_integration.py
"""
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
FAILED = []


def check(name, cond, detail=""):
    print(f"   [{'PASS' if cond else 'FAIL'}] {name} {detail}")
    if not cond:
        FAILED.append(name)


def get(path, **params):
    r = client.get(f"/api{path}", params=params)
    assert r.status_code == 200, f"GET {path} -> {r.status_code}: {r.text[:200]}"
    return r.json()


def post(path, body):
    r = client.post(f"/api{path}", json=body)
    assert r.status_code == 200, f"POST {path} -> {r.status_code}: {r.text[:200]}"
    return r.json()


def main():
    print("=" * 66)
    print("  KENYA RE - API INTEGRATION (frontend contract)")
    print("=" * 66)

    print(">> Hazard")
    h = post("/hazard/lookup", {"lat": -1.2612, "lng": 36.8584, "return_period": "100y"})
    check("hazard/lookup returns depth", "depth_m" in h, f"depth={h['depth_m']}")
    hot = get("/hazard/hotspots", return_period="100y")
    check("hazard/hotspots non-empty", len(hot) > 0, f"n={len(hot)}")
    check("hotspot lon is real (regression: lng/lon key)", all(36.5 < x["lon"] < 37.2 for x in hot))
    check("some hotspots are wet at 100y", any(x["depth_m"] > 0 for x in hot), f"wet={sum(1 for x in hot if x['depth_m'] > 0)}")
    grid = get("/hazard/grid", return_period="100y", step=16)
    check("hazard/grid has wet cells", grid["count"] > 0, f"cells={grid['count']}")

    print(">> Vulnerability")
    c = get("/vulnerability/curves")
    check("4 housing classes", len(c["curves"]) == 4, f"classes={list(c['curves'])}")

    print(">> Exposure")
    s = get("/exposure/stats")
    check("TIV is real 63.6B, not 4.82B", abs(s["total_tiv_kes"] - 63_635_075_000) < 1, f"{s['total_tiv_kes']:,.0f}")
    a = get("/exposure/assets", return_period="100y", limit=1000)
    check("600 assets returned", a["total"] == 600 and a["returned"] == 600)
    first = a["assets"][0]
    check("asset has damage_ratio/loss/risk_level", all(k in first for k in ("damage_ratio", "loss_kes", "risk_level")))
    w = get("/exposure/assets", return_period="100y", ward="Mathare")
    check("ward filter works", 0 < w["total"] < 600, f"Mathare={w['total']}")

    print(">> Portfolio summary")
    ps = get("/portfolio/summary", return_period="100y")
    check("summary AAL is trapezoidal (not loss*0.112)", abs(ps["aal_kes"] - ps["event_loss_kes"] * 0.112) > 1, f"AAL={ps['aal_kes']:,.0f}")
    check("summary has PML100", ps["pml_100y_kes"] > 0)

    print(">> EP curve")
    ep = get("/curves/ep", ai_enabled=True)
    check("5 RP metrics", len(ep["metrics"]) == 5)
    check("AI curve above baseline at 100y", ep["metrics"][-1]["ai_adjusted_loss"] > ep["metrics"][-1]["portfolio_loss_kes"])
    check("baseline AAL < AI AAL", ep["baseline_aal_kes"] < ep["aal_kes"], f"{ep['baseline_aal_kes']:,.0f} -> {ep['aal_kes']:,.0f}")

    print(">> Model run")
    m = post("/model/run", {"scenario": "100y", "apply_ai": True})
    check("run: loss_by_class populated", len(m["loss_by_class"]) == 4)
    check("run: loss_by_ward populated", len(m["loss_by_ward"]) > 0)
    check("run: top_losses populated", len(m["top_losses"]) > 0)
    check("run: ai delta positive", (m["ai_delta_kes"] or 0) > 0, f"+{m['ai_delta_kes']:,.0f}")
    check("run: source baseline", m["source"] == "baseline_portfolio")
    up = post("/model/run", {"scenario": "100y", "apply_ai": False, "exposure": [{
        "id": "T1", "name": "Test", "lat": -1.2612, "lng": 36.8584, "housing_class": "informal_iron_sheet",
        "area_sqm": 100, "tiv_kes": 5_000_000}]})
    check("run: uploaded exposure respected", up["asset_count"] == 1 and up["source"] == "uploaded_exposure")

    print(">> Reinsurance & quotes")
    x = post("/reinsurance/xol", {"attachment_kes": 50_000_000, "limit_kes": 100_000_000, "share_pct": 1.0})
    check("xol layer AAL > 0", x["layer_aal_kes"] > 0)
    q = post("/quotes/facultative", {"tiv_kes": 1_090_000_000, "lat": -1.2847, "lng": 36.8247,
                                     "housing_class": "concrete_rcc", "deductible_pct": 0.05})
    check("facultative premium > 0", q["recommended_annual_premium_kes"] > 0)

    print(">> AI")
    p = post("/ai/parse-slip", {"text": "5 iron sheet warehouses in Mathare, 350 sqm each, KES 18M total"})
    check("parse-slip returns assets", len(p["parsed_assets"]) == 5)

    print("=" * 66)
    if FAILED:
        print(f">> FAILED: {FAILED}")
        sys.exit(1)
    print(">> VERDICT: ALL FRONTEND-FACING ENDPOINTS PASS")


if __name__ == "__main__":
    main()
