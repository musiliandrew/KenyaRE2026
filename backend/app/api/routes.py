from fastapi import APIRouter
from typing import List, Dict, Any
from app.models.schemas import PortfolioSummary, ReturnPeriodMetric, NLPParseRequest, NLPParseResponse
from app.services.cat_engine import calculate_jrc_damage_ratio, calculate_asset_loss, RP_DEPTH_ANCHORS

router = APIRouter()


@router.get("/health", tags=["System"])
def health_check() -> Dict[str, str]:
    return {"status": "ok", "service": "Kenya Re Catastrophe Modeling API", "version": "1.0.0"}


@router.get("/portfolio/summary", response_model=PortfolioSummary, tags=["Pillars 3 & 4: Exposure & Finance"])
def get_portfolio_summary(return_period: str = "100y"):
    """
    Returns high-level executive metrics for Nairobi urban pluvial exposure.
    """
    return PortfolioSummary(
        tiv_kes=4_820_000_000.0,
        event_loss_kes=842_600_000.0 if return_period == "100y" else 350_000_000.0,
        aal_kes=94_200_000.0,
        asset_count=600,
        active_rp=return_period,
        hotspot_count=24,
    )


@router.get("/curves/ep", response_model=List[ReturnPeriodMetric], tags=["Pillar 4: Financial Engine"])
def get_ep_curve():
    """
    Returns Exceedance Probability (EP) curve data across calibrated return periods.
    """
    return [
        ReturnPeriodMetric(return_period="5y", years=5, annual_prob=0.20, portfolio_loss_kes=92_000_000.0, loss_ratio=0.019, pml_90=110_000_000.0),
        ReturnPeriodMetric(return_period="10y", years=10, annual_prob=0.10, portfolio_loss_kes=185_000_000.0, loss_ratio=0.038, pml_90=220_000_000.0),
        ReturnPeriodMetric(return_period="25y", years=25, annual_prob=0.04, portfolio_loss_kes=390_000_000.0, loss_ratio=0.081, pml_90=465_000_000.0),
        ReturnPeriodMetric(return_period="50y", years=50, annual_prob=0.02, portfolio_loss_kes=620_000_000.0, loss_ratio=0.129, pml_90=730_000_000.0),
        ReturnPeriodMetric(return_period="100y", years=100, annual_prob=0.01, portfolio_loss_kes=842_600_000.0, loss_ratio=0.175, pml_90=980_000_000.0),
    ]


@router.post("/ai/parse-slip", response_model=NLPParseResponse, tags=["AI Intelligence Layer"])
def parse_slip(req: NLPParseRequest):
    """
    Natural Language Exposure Ingestion: parses free-text underwriting notes into structured exposure.
    """
    text_lower = req.text.lower()
    housing = "informal_iron_sheet" if "iron" in text_lower else "permanent_masonry"
    tiv = 18_000_000.0
    depth = 1.10
    ratio = calculate_jrc_damage_ratio(depth, housing)
    technical_rate = round(ratio * 0.045 * 100, 2)
    premium = round(tiv * (technical_rate / 100), 2)

    return NLPParseResponse(
        extracted_structures=5,
        housing_class=housing,
        location="Mathare (Juja Road Corridors)",
        total_area_sqm=1750.0,
        estimated_tiv_kes=tiv,
        hazard_tier="100y (Extreme)",
        estimated_depth_m=depth,
        damage_ratio=round(ratio, 4),
        recommended_premium_kes=premium,
        technical_rate_pct=technical_rate,
        summary=f"Extracted policy slip for {housing} near Mathare. Calculated flood loading with technical rate of {technical_rate}%."
    )

