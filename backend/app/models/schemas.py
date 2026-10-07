from pydantic import BaseModel, Field
from typing import List, Optional, Dict


class ExposureAsset(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    housing_class: str = Field(..., description="informal_iron_sheet, semi_permanent, or permanent_masonry")
    area_sqm: float
    tiv_kes: float
    hazard_score: float = Field(..., ge=0.0, le=1.0)
    drainage_penalty: float = 0.0
    effective_hazard: float = 0.0
    loss_kes: float = 0.0
    damage_ratio: float = 0.0
    synthetic: bool = True


class ReturnPeriodMetric(BaseModel):
    return_period: str
    years: int
    annual_prob: float
    portfolio_loss_kes: float
    loss_ratio: float
    pml_90: float


class PortfolioSummary(BaseModel):
    tiv_kes: float
    event_loss_kes: float
    aal_kes: float
    asset_count: int
    active_rp: str
    hotspot_count: int
    synthetic_notice: str = "All values synthetic for hackathon evaluation."


class NLPParseRequest(BaseModel):
    text: str = Field(..., example="5 iron sheet warehouses in Mathare along Juja road, 350 sqm each, KES 18M total")


class NLPParseResponse(BaseModel):
    extracted_structures: int
    housing_class: str
    location: str
    total_area_sqm: float
    estimated_tiv_kes: float
    hazard_tier: str
    estimated_depth_m: float
    damage_ratio: float
    recommended_premium_kes: float
    technical_rate_pct: float
    summary: str
