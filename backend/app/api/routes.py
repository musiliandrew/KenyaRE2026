from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.models.schemas import (
    PortfolioSummary, ReturnPeriodMetric, EPCurveResponse,
    HazardLookupRequest, HazardLookupResponse,
    DamageCalculationRequest, DamageCalculationResponse,
    RunModelRequest, RunModelResponse,
    NLPParseRequest, NLPParseResponse,
    BriefingRequest, BriefingResponse,
    ExposureUpload, ExposureAsset
)
from app.services.cat_engine import (
    calculate_jrc_damage_ratio, calculate_asset_loss,
    calculate_portfolio_loss, compute_ep_curve, calculate_aal,
    lookup_hazard_score, apply_ai_drainage_adjustments,
    RP_DEPTH_ANCHORS, RP_LABELS
)
from app.services.ai_service import parse_natural_language_portfolio, generate_risk_briefing
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
# PILLAR 1: HAZARD LAYER
# ============================================================================

@router.post("/hazard/lookup", response_model=HazardLookupResponse, tags=["Pillar 1: Hazard"])
def lookup_hazard(req: HazardLookupRequest):
    """
    Looks up hazard score and depth for a given location and return period.
    
    In production, this would sample from actual GeoTIFF raster files using Rasterio.
    Currently returns proxy values for demonstration.
    """
    result = lookup_hazard_score(req.lat, req.lng, req.return_period.value)
    return HazardLookupResponse(**result)


# ============================================================================
# PILLAR 2: VULNERABILITY LAYER
# ============================================================================

@router.post("/vulnerability/calculate", response_model=DamageCalculationResponse, tags=["Pillar 2: Vulnerability"])
def calculate_damage(req: DamageCalculationRequest):
    """
    Calculates damage ratio and loss for a single asset given depth and housing class.
    Uses JRC/Huizinga sigmoid depth-damage curves.
    """
    result = calculate_asset_loss(req.tiv_kes, req.depth_m, req.housing_class.value)
    return DamageCalculationResponse(
        housing_class=req.housing_class.value,
        depth_m=req.depth_m,
        tiv_kes=req.tiv_kes,
        damage_ratio=result["damage_ratio"],
        loss_kes=result["loss_kes"],
        damage_cap_pct=result["damage_cap_pct"]
    )


# ============================================================================
# PILLAR 3: EXPOSURE LAYER
# ============================================================================

@router.get("/portfolio/summary", response_model=PortfolioSummary, tags=["Pillar 3: Exposure"])
def get_portfolio_summary(return_period: str = "100y"):
    """
    Returns high-level executive metrics for Nairobi urban pluvial exposure.
    Uses synthetic exposure data for demonstration.
    """
    assets = get_synthetic_exposure()
    result = calculate_portfolio_loss(assets, return_period, apply_ai=True)
    aal = calculate_aal(assets, apply_ai=True)
    
    return PortfolioSummary(
        tiv_kes=result["total_tiv_kes"],
        event_loss_kes=result["portfolio_loss_kes"],
        aal_kes=aal,
        asset_count=result["asset_count"],
        active_rp=return_period,
        hotspot_count=len(get_synthetic_hotspots()),
    )


@router.post("/portfolio/upload", tags=["Pillar 3: Exposure"])
def upload_exposure(upload: ExposureUpload):
    """
    Uploads exposure data (CSV or JSON format).
    Validates and stores the portfolio for analysis.
    """
    # In production, this would validate against schema and store in database
    return {
        "message": f"Received {len(upload.assets)} assets",
        "source": upload.source,
        "total_tiv_kes": sum(asset.tiv_kes for asset in upload.assets),
        "status": "uploaded"
    }


@router.get("/portfolio/assets", tags=["Pillar 3: Exposure"])
def get_exposure_assets(limit: int = 100):
    """
    Returns exposure assets from the synthetic portfolio.
    """
    assets = get_synthetic_exposure()
    return {
        "total": len(assets),
        "returned": min(limit, len(assets)),
        "assets": assets[:limit]
    }


@router.get("/portfolio/hotspots", tags=["Pillar 3: Exposure"])
def get_hotspots():
    """
    Returns known flood hotspots in Nairobi.
    """
    hotspots = get_synthetic_hotspots()
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
    Returns Exceedance Probability (EP) curve data across all return periods.
    """
    assets = get_synthetic_exposure()
    metrics = compute_ep_curve(assets, apply_ai=ai_enabled)
    total_tiv = sum(asset["tiv_kes"] for asset in assets)
    aal = calculate_aal(assets, apply_ai=ai_enabled)
    
    return EPCurveResponse(
        metrics=[ReturnPeriodMetric(**m) for m in metrics],
        total_tiv_kes=total_tiv,
        aal_kes=aal,
        ai_enabled=ai_enabled
    )


@router.post("/model/run", response_model=RunModelResponse, tags=["Pillar 4: Financial Engine"])
def run_model(req: RunModelRequest):
    """
    Runs the full catastrophe model for a given scenario.
    Computes portfolio loss, EP curve, and AAL.
    """
    # Use provided exposure or synthetic data
    assets = req.exposure if req.exposure else get_synthetic_exposure()
    
    # Apply AI adjustments if requested
    if req.apply_ai:
        assets = apply_ai_drainage_adjustments(assets.copy())
    
    # Calculate portfolio loss for the scenario
    result = calculate_portfolio_loss(assets, req.scenario.value, apply_ai=req.apply_ai)
    
    # Calculate AAL
    aal = calculate_aal(assets, apply_ai=req.apply_ai)
    
    # Calculate AI delta
    ai_delta = None
    if req.apply_ai:
        result_no_ai = calculate_portfolio_loss(assets, req.scenario.value, apply_ai=False)
        ai_delta = result["portfolio_loss_kes"] - result_no_ai["portfolio_loss_kes"]
    
    # Get full EP curve
    ep_curve = compute_ep_curve(assets, apply_ai=req.apply_ai)
    
    return RunModelResponse(
        scenario=req.scenario.value,
        total_tiv_kes=result["total_tiv_kes"],
        portfolio_loss_kes=result["portfolio_loss_kes"],
        loss_ratio=result["loss_ratio"],
        aal_kes=aal,
        asset_count=result["asset_count"],
        ai_enabled=req.apply_ai,
        ai_delta_kes=ai_delta,
        loss_by_class=result["loss_by_class"],
        top_losses=result["top_losses"],
        ep_curve=[ReturnPeriodMetric(**m) for m in ep_curve]
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
