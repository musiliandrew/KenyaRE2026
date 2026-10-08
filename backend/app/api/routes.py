from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import List, Dict, Any, Optional
from app.models.schemas import (
    PortfolioSummary, ReturnPeriodMetric, EPCurveResponse,
    HazardLookupRequest, HazardLookupResponse,
    DamageCalculationRequest, DamageCalculationResponse,
    RunModelRequest, RunModelResponse,
    NLPParseRequest, NLPParseResponse,
    BriefingRequest, BriefingResponse,
    ExposureUpload, ExposureAsset,
    XoLTreatyRequest, XoLTreatyResponse,
    FacultativeQuoteRequest, FacultativeQuoteResponse,
    AIChatRequest
)
from app.services.financial_engine import financial_engine
from app.services.cat_engine import (
    calculate_jrc_damage_ratio, calculate_asset_loss,
    calculate_portfolio_loss, compute_ep_curve, calculate_aal,
    lookup_hazard_score, apply_ai_drainage_adjustments,
    RP_DEPTH_ANCHORS, RP_LABELS
)
from app.services.ai_service import parse_natural_language_portfolio, generate_risk_briefing, stream_ai_chat
from app.services.synthetic_data import get_synthetic_exposure, get_synthetic_hotspots

router = APIRouter()


# ============================================================================
# SYSTEM ENDPOINTS
# ============================================================================

@router.get("/health", tags=["System"])
def health_check() -> Dict[str, str]:
    """Health check endpoint for monitoring."""
    return {"status": "ok", "service": "Kenya Re Catastrophe Modeling API", "version": "1.0.0"}


@router.get("/", tags=["System"])
def root() -> Dict[str, Any]:
    """Root endpoint with API information."""
    return {
        "message": "Kenya Re Catastrophe Risk Intelligence API",
        "version": "1.0.0",
        "docs": "/docs",
        "organization": "Kenya Reinsurance Corporation",
        "challenge": "Team A - Nairobi Urban Surface-Water Flood",
        "endpoints": {
            "hazard": "/api/hazard/lookup",
            "vulnerability": "/api/vulnerability/calculate",
            "portfolio": "/api/portfolio/summary",
            "ep_curve": "/api/curves/ep",
            "run_model": "/api/model/run",
            "ai_parse": "/api/ai/parse-slip",
            "ai_briefing": "/api/ai/briefing"
        }
    }


# ============================================================================
# PILLAR 1: HAZARD LAYER (CLIMADA Compatible & GeoTIFF Driven)
# ============================================================================

from app.services.hazard_engine import hazard_engine

@router.post("/hazard/lookup", response_model=HazardLookupResponse, tags=["Pillar 1: Hazard"])
def lookup_hazard(req: HazardLookupRequest):
    """
    Sub-millisecond raster lookup: samples pluvial susceptibility and calibrated flood depth
    directly from the 5 GeoTIFF rasters using exact affine transform coordinates.
    """
    res = hazard_engine.get_hazard_depth(req.lat, req.lng, req.return_period.value)
    return HazardLookupResponse(
        lat=res["lat"],
        lng=res["lon"],
        return_period=res["return_period"],
        hazard_score=res["hazard_score"],
        depth_m=res["depth_m"],
        tier_label=res["tier_label"]
    )


@router.get("/hazard/hotspots", tags=["Pillar 1: Hazard"])
def get_validated_hotspots(return_period: str = "100y") -> List[Dict[str, Any]]:
    """
    Returns the 24 official county flood hotspots evaluated across the requested return period raster.
    """
    hotspots = get_synthetic_hotspots()
    return hazard_engine.validate_hotspots(hotspots, return_period)


@router.post("/hazard/climada-matrix", tags=["Pillar 1: Hazard"])
def get_climada_matrix(req: List[Dict[str, float]]) -> Dict[str, Any]:
    """
    Constructs a CLIMADA-compatible Hazard structure (intensity matrix, frequency array, centroids)
    for arbitrary coordinates across all 5 calibrated return periods.
    """
    coords = [(item["lat"], item["lng"]) for item in req]
    matrix = hazard_engine.to_climada_hazard_matrix(coords)
    return {
        "climada_compatible": matrix["climada_compatible"],
        "n_events": matrix["n_events"],
        "n_centroids": matrix["n_centroids"],
        "events": matrix["events"],
        "frequency": matrix["frequency"],
        "intensity_dep_m": matrix["intensity_matrix"].tolist()
    }


# ============================================================================
# PILLAR 2: VULNERABILITY LAYER
# ============================================================================

from app.services.vulnerability_engine import vulnerability_engine

@router.post("/vulnerability/calculate", response_model=DamageCalculationResponse, tags=["Pillar 2: Vulnerability"])
def calculate_damage(req: DamageCalculationRequest):
    """
    Calculates damage ratio and financial loss for a single asset given depth and housing class.
    Uses continuous JRC/Huizinga sigmoid depth-damage curves with physical caps.
    """
    res = vulnerability_engine.calculate_loss(req.tiv_kes, req.depth_m, req.housing_class.value)
    return DamageCalculationResponse(
        housing_class=res["housing_class"],
        depth_m=res["depth_m"],
        tiv_kes=res["tiv_kes"],
        damage_ratio=res["damage_ratio"],
        loss_kes=res["loss_kes"],
        damage_cap_pct=res["cap_pct"]
    )


@router.get("/vulnerability/curves", tags=["Pillar 2: Vulnerability"])
def get_vulnerability_curves(max_depth_m: float = 4.0, step_m: float = 0.1) -> Dict[str, Any]:
    """
    Returns discretized evaluation points for all 4 construction classes for UI charting.
    """
    return {
        "curves": vulnerability_engine.get_all_curves(max_depth_m, step_m),
        "parameters": vulnerability_engine.curves
    }


@router.get("/vulnerability/climada-impact", tags=["Pillar 2: Vulnerability"])
def get_climada_impact_functions() -> Dict[str, Any]:
    """
    Exports all 4 depth-damage functions formatted as CLIMADA ImpactFunc objects.
    """
    return vulnerability_engine.to_climada_impact_funcs()


# ============================================================================
# PILLAR 3: EXPOSURE LAYER
# ============================================================================

from app.services.exposure_engine import exposure_engine

@router.get("/portfolio/summary", response_model=PortfolioSummary, tags=["Pillar 3: Exposure"])
def get_portfolio_summary(return_period: str = "100y"):
    """
    Returns executive metrics for Nairobi urban pluvial exposure using verified baseline portfolio.
    """
    stats = exposure_engine.get_summary_statistics()
    ep = financial_engine.calculate_ep_curve()
    point = next((m for m in ep["ep_curve"] if m["return_period"] == return_period), ep["ep_curve"][-1])

    return PortfolioSummary(
        tiv_kes=stats["total_tiv_kes"],
        event_loss_kes=point["gross_loss_kes"],
        aal_kes=ep["aal_gross_kes"],
        asset_count=stats["asset_count"],
        active_rp=return_period,
        hotspot_count=len(get_synthetic_hotspots()),
        pml_100y_kes=ep["pml_100y_kes"],
        loss_ratio=point["loss_ratio"],
    )


@router.get("/exposure/assets", tags=["Pillar 3: Exposure"])
def get_exposure_assets(
    return_period: str = "100y",
    limit: int = 1000,
    offset: int = 0,
    ward: Optional[str] = None,
    housing_class: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Returns geocoded portfolio assets enriched with spatial hazard depth, damage ratio,
    modeled loss and risk level for the requested return period.
    """
    from app.services.vulnerability_engine import vulnerability_engine

    assets = exposure_engine.assets
    if ward:
        assets = [a for a in assets if a.get("ward", "").lower() == ward.lower()]
    if housing_class:
        assets = [a for a in assets if a["housing_class"] == housing_class]

    enriched = exposure_engine.match_spatial_hazard(return_period, assets=assets)
    for a in enriched:
        calc = vulnerability_engine.calculate_loss(a["tiv_kes"], a["depth_m"], a["housing_class"])
        a["damage_ratio"] = calc["damage_ratio"]
        a["loss_kes"] = calc["loss_kes"]
        a["risk_level"] = "high" if calc["damage_ratio"] > 0.35 else "mid" if calc["damage_ratio"] > 0.08 else "low"

    page = enriched[offset: offset + limit]
    return {"total": len(enriched), "offset": offset, "returned": len(page), "return_period": return_period, "assets": page}


@router.get("/hazard/grid", tags=["Pillar 1: Hazard"])
def get_hazard_grid(return_period: str = "100y", step: int = 12, min_depth_m: float = 0.05) -> Dict[str, Any]:
    """
    Downsampled wet-cell grid from the GeoTIFF raster for the deck.gl / MapLibre flood layer.
    """
    return hazard_engine.get_hazard_grid(return_period, step=max(2, min(step, 64)), min_depth_m=min_depth_m)


@router.get("/exposure/stats", tags=["Pillar 3: Exposure"])
def get_exposure_statistics() -> Dict[str, Any]:
    """
    Returns capital allocation by housing class, TIV share, and administrative ward distribution.
    """
    return exposure_engine.get_summary_statistics()


@router.get("/exposure/climada-entity", tags=["Pillar 3: Exposure"])
def get_climada_exposure_entity() -> Dict[str, Any]:
    """
    Exports full portfolio formatted as CLIMADA Exposures / Entity data dictionary.
    """
    return exposure_engine.to_climada_exposure()


@router.post("/portfolio/upload", tags=["Pillar 3: Exposure"])
def upload_exposure(upload: ExposureUpload):
    """
    Uploads exposure data (Oasis OED format), validates bounding boxes, and returns normalized portfolio.
    """
    raw_dicts = [a.model_dump() for a in upload.assets]
    valid, errors = exposure_engine.validate_exposure_records(raw_dicts)
    return {
        "message": f"Successfully ingested {len(valid)} valid assets",
        "valid_count": len(valid),
        "rejected_count": len(errors),
        "errors": errors,
        "total_tiv_kes": sum(a["tiv_kes"] for a in valid),
        "source": upload.source
    }


@router.get("/portfolio/assets", tags=["Pillar 3: Exposure"])
def get_portfolio_assets(limit: int = 100):
    """
    Returns the baseline exposure portfolio (600 buildings) from the Exposure Engine.
    """
    assets = exposure_engine.assets
    return {
        "total": len(assets),
        "returned": min(limit, len(assets)),
        "assets": assets[:limit]
    }


@router.get("/portfolio/hotspots", tags=["Pillar 3: Exposure"])
def get_hotspots(return_period: str = "100y"):
    """
    Returns county flood hotspots evaluated against the hazard raster (depth and susceptibility).
    """
    hotspots = hazard_engine.validate_hotspots(get_synthetic_hotspots(), return_period)
    return {
        "count": len(hotspots),
        "hotspots": hotspots
    }


# ============================================================================
# PILLAR 4: FINANCIAL ENGINE
# ============================================================================

@router.get("/curves/ep", response_model=EPCurveResponse, tags=["Pillar 4: Financial Engine"])
def get_ep_curve(ai_enabled: bool = True):
    """
    Returns Exceedance Probability (EP) curve data and trapezoidal AAL across all 5 calibrated return periods.
    Powered by the Module 4 Financial Engine with GeoTIFF raster event sampling.
    """
    base = financial_engine.calculate_ep_curve(apply_ai_drainage=False)
    ai = financial_engine.calculate_ep_curve(apply_ai_drainage=True) if ai_enabled else None
    ai_by_rp = {m["return_period"]: m for m in ai["ep_curve"]} if ai else {}

    metrics = []
    for m in base["ep_curve"]:
        a = ai_by_rp.get(m["return_period"])
        metrics.append(ReturnPeriodMetric(
            return_period=m["return_period"],
            years=m["years"],
            annual_prob=m["annual_prob"],
            portfolio_loss_kes=m["gross_loss_kes"],
            loss_ratio=m["loss_ratio"],
            pml_90=m["pml_90"],
            ai_adjusted_loss=a["gross_loss_kes"] if a else None,
            ai_delta_kes=round(a["gross_loss_kes"] - m["gross_loss_kes"], 2) if a else None,
        ))
    return EPCurveResponse(
        metrics=metrics,
        total_tiv_kes=base["total_tiv_kes"],
        aal_kes=ai["aal_gross_kes"] if ai else base["aal_gross_kes"],
        baseline_aal_kes=base["aal_gross_kes"],
        ai_enabled=ai_enabled
    )


@router.post("/reinsurance/xol", response_model=XoLTreatyResponse, tags=["Pillar 4: Financial Engine"])
def price_xol_treaty(req: XoLTreatyRequest):
    """
    Prices an Excess of Loss (XOL) Reinsurance Treaty layer with pure burn rate,
    capital margin, and return-period exhaustion tracking.
    """
    res = financial_engine.price_reinsurance_xol(
        attachment_kes=req.attachment_kes,
        limit_kes=req.limit_kes,
        share_pct=req.share_pct,
        apply_ai_drainage=req.apply_ai_drainage
    )
    return XoLTreatyResponse(**res)


@router.post("/quotes/facultative", response_model=FacultativeQuoteResponse, tags=["Pillar 4: Financial Engine"])
def quote_facultative_slip(req: FacultativeQuoteRequest):
    """
    Calculates technical pure risk premium, deductible retention, and underwriting rates
    for an individual policy slip (e.g. Landmark Plaza Upper Hill from testData.md).
    """
    res = financial_engine.quote_single_slip_facultative(
        tiv_kes=req.tiv_kes,
        lat=req.lat,
        lon=req.lng,
        housing_class=req.housing_class.value,
        deductible_pct=req.deductible_pct
    )
    return FacultativeQuoteResponse(
        tiv_kes=res["tiv_kes"],
        lat=res["lat"],
        lon=res["lon"],
        housing_class=res["housing_class"],
        deductible_pct=res["deductible_pct"],
        deductible_kes=res["deductible_kes"],
        asset_aal_gross_kes=res["asset_aal_gross_kes"],
        asset_aal_insured_kes=res["asset_aal_insured_kes"],
        pure_rate_pct=res["pure_rate_pct"],
        recommended_technical_rate_pct=res["recommended_technical_rate_pct"],
        recommended_annual_premium_kes=res["recommended_annual_premium_kes"],
        depth_100y_m=res["100y_extreme_depth_m"],
        insured_loss_100y_kes=res["100y_extreme_loss_kes"]
    )


@router.post("/model/run", response_model=RunModelResponse, tags=["Pillar 4: Financial Engine"])
def run_model(req: RunModelRequest):
    """
    Runs the full catastrophe pipeline (hazard rasters -> JRC vulnerability -> exposure -> financial engine)
    for a scenario. Uses the uploaded exposure if supplied, otherwise the baseline 600-building portfolio.
    """
    custom = None
    if req.exposure:
        custom = [
            {
                "loc_id": a.id, "name": a.name, "lat": a.lat, "lon": a.lng,
                "housing_class": a.housing_class.value, "floor_area_m2": a.area_sqm,
                "tiv_kes": a.tiv_kes, "ward": a.ward or "Uploaded",
            }
            for a in req.exposure
        ]

    base = financial_engine.calculate_ep_curve(assets=custom, apply_ai_drainage=False)
    active = financial_engine.calculate_ep_curve(assets=custom, apply_ai_drainage=req.apply_ai) if req.apply_ai else base

    rp = req.scenario.value
    elt = next(e for e in active["event_loss_table"] if e["return_period"] == rp)
    base_elt = next(e for e in base["event_loss_table"] if e["return_period"] == rp)
    base_curve = {m["return_period"]: m for m in base["ep_curve"]}

    metrics = []
    for m in active["ep_curve"]:
        b = base_curve[m["return_period"]]
        metrics.append(ReturnPeriodMetric(
            return_period=m["return_period"], years=m["years"], annual_prob=m["annual_prob"],
            portfolio_loss_kes=b["gross_loss_kes"], loss_ratio=b["loss_ratio"], pml_90=b["pml_90"],
            ai_adjusted_loss=m["gross_loss_kes"] if req.apply_ai else None,
            ai_delta_kes=round(m["gross_loss_kes"] - b["gross_loss_kes"], 2) if req.apply_ai else None,
        ))

    return RunModelResponse(
        scenario=rp,
        total_tiv_kes=active["total_tiv_kes"],
        portfolio_loss_kes=elt["gross_portfolio_loss_kes"],
        loss_ratio=elt["gross_loss_ratio"],
        aal_kes=active["aal_gross_kes"],
        asset_count=len(custom) if custom is not None else len(exposure_engine.assets),
        ai_enabled=req.apply_ai,
        ai_delta_kes=round(elt["gross_portfolio_loss_kes"] - base_elt["gross_portfolio_loss_kes"], 2) if req.apply_ai else None,
        aal_ai_delta_kes=round(active["aal_gross_kes"] - base["aal_gross_kes"], 2) if req.apply_ai else None,
        loss_by_class=elt["loss_by_class"],
        loss_by_ward=elt["top_loss_wards"],
        top_losses=elt["top_properties"],
        ep_curve=metrics,
        source="uploaded_exposure" if custom is not None else "baseline_portfolio",
    )



# ============================================================================
# AI INTELLIGENCE LAYER
# ============================================================================

@router.post("/ai/parse-slip", response_model=NLPParseResponse, tags=["AI Intelligence Layer"])
def parse_slip(req: NLPParseRequest):
    """
    Natural Language Exposure Ingestion: parses free-text underwriting notes into structured exposure.
    
    Example: "5 iron sheet warehouses in Mathare along Juja road, 350 sqm each, KES 18M total"
    """
    result = parse_natural_language_portfolio(req.text)
    
    return NLPParseResponse(
        extracted_structures=result["extracted_structures"],
        housing_class=result["housing_class"],
        location=result["location"],
        total_area_sqm=result["total_area_sqm"],
        estimated_tiv_kes=result["estimated_tiv_kes"],
        hazard_tier=result["hazard_tier"],
        estimated_depth_m=result["estimated_depth_m"],
        damage_ratio=result["damage_ratio"],
        recommended_premium_kes=result["recommended_premium_kes"],
        technical_rate_pct=result["technical_rate_pct"],
        summary=result["summary"],
        parsed_assets=[ExposureAsset(**a) for a in result["parsed_assets"]]
    )

@router.post("/ai/briefing", response_model=BriefingResponse, tags=["AI Intelligence Layer"])
def generate_briefing(req: BriefingRequest):
    """
    Generates a natural-language risk briefing for underwriters.
    Summarizes model results in plain English.
    """
    result = generate_risk_briefing(
        scenario=req.scenario.value,
        portfolio_loss_kes=req.portfolio_loss_kes,
        loss_ratio=req.loss_ratio,
        key_hotspots=req.key_hotspots,
        ai_enabled=req.ai_enabled
    )
    
    return BriefingResponse(**result)


@router.post("/ai/chat/stream", tags=["AI Intelligence Layer"])
def chat_stream(req: AIChatRequest):
    """
    Streams interactive AI Copilot responses token-by-token using Groq (openai/gpt-oss-120b).
    """
    def event_generator():
        for token in stream_ai_chat(req.message, req.history):
            yield token

    return StreamingResponse(event_generator(), media_type="text/plain")

