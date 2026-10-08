from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Literal, Any
from enum import Enum


class HousingClass(str, Enum):
    informal_iron_sheet = "informal_iron_sheet"
    semi_permanent = "semi_permanent"
    permanent_masonry = "permanent_masonry"
    concrete_rcc = "concrete_rcc"


class ReturnPeriod(str, Enum):
    rp5 = "5y"
    rp10 = "10y"
    rp25 = "25y"
    rp50 = "50y"
    rp100 = "100y"


class ExposureAsset(BaseModel):
    id: str
    name: str
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    housing_class: HousingClass
    area_sqm: float = Field(..., gt=0)
    tiv_kes: float = Field(..., gt=0)
    ward: Optional[str] = None
    hazard_score: float = Field(default=0.0, ge=0.0, le=1.0, description="Proxy hazard score 0-1 from terrain analysis")
    drainage_penalty: float = Field(default=0.0, ge=0.0, description="AI-detected drainage gap penalty")
    effective_hazard: float = Field(default=0.0, ge=0.0, description="Combined hazard after AI adjustment")
    loss_kes: float = Field(default=0.0, ge=0.0)
    damage_ratio: float = Field(default=0.0, ge=0.0, le=1.0)
    synthetic: bool = True


class ExposureUpload(BaseModel):
    assets: List[ExposureAsset]
    source: str = Field(default="upload", description="upload, nlp_parse, or synthetic")


class HazardLookupRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    return_period: ReturnPeriod


class HazardLookupResponse(BaseModel):
    lat: float
    lng: float
    return_period: str
    hazard_score: float
    depth_m: float
    tier_label: str


class DamageCalculationRequest(BaseModel):
    housing_class: HousingClass
    depth_m: float = Field(..., ge=0.0)
    tiv_kes: float = Field(..., gt=0)


class DamageCalculationResponse(BaseModel):
    housing_class: str
    depth_m: float
    tiv_kes: float
    damage_ratio: float
    loss_kes: float
    damage_cap_pct: float


class ReturnPeriodMetric(BaseModel):
    return_period: str
    years: int
    annual_prob: float
    portfolio_loss_kes: float
    loss_ratio: float
    pml_90: float
    ai_adjusted_loss: Optional[float] = None
    ai_delta_kes: Optional[float] = None


class EPCurveResponse(BaseModel):
    metrics: List[ReturnPeriodMetric]
    total_tiv_kes: float
    aal_kes: float
    baseline_aal_kes: Optional[float] = None
    ai_enabled: bool


class PortfolioSummary(BaseModel):
    tiv_kes: float
    event_loss_kes: float
    aal_kes: float
    asset_count: int
    active_rp: str
    hotspot_count: int
    pml_100y_kes: float = 0.0
    loss_ratio: float = 0.0
    synthetic_notice: str = "All values synthetic for hackathon evaluation."


class RunModelRequest(BaseModel):
    scenario: ReturnPeriod = Field(default=ReturnPeriod.rp100)
    apply_ai: bool = Field(default=True, description="Apply AI drainage gap adjustments")
    exposure: Optional[List[ExposureAsset]] = None


class RunModelResponse(BaseModel):
    scenario: str
    total_tiv_kes: float
    portfolio_loss_kes: float
    loss_ratio: float
    aal_kes: float
    asset_count: int
    ai_enabled: bool
    ai_delta_kes: Optional[float] = None
    loss_by_class: Dict[str, float]
    loss_by_ward: Dict[str, float] = {}
    top_losses: List[Dict[str, Any]]
    ep_curve: List[ReturnPeriodMetric]
    aal_ai_delta_kes: Optional[float] = None
    source: str = "baseline_portfolio"


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
    parsed_assets: Optional[List[ExposureAsset]] = None


class BriefingRequest(BaseModel):
    scenario: ReturnPeriod
    portfolio_loss_kes: float
    loss_ratio: float
    key_hotspots: List[str]
    ai_enabled: bool = True


class BriefingResponse(BaseModel):
    briefing: str
    executive_summary: str
    key_findings: List[str]
    recommendations: List[str]
    disclaimer: str


class XoLTreatyRequest(BaseModel):
    attachment_kes: float = Field(..., gt=0, description="Attachment point in KES (e.g. 50,000,000)")
    limit_kes: float = Field(..., gt=0, description="Treaty layer limit in KES (e.g. 100,000,000)")
    share_pct: float = Field(default=1.0, ge=0.0, le=1.0, description="Treaty participation share (0.0 to 1.0, e.g. 1.0 = 100%)")
    apply_ai_drainage: bool = Field(default=False, description="Stress-test layer with AI drainage gap penalties")


class XoLTreatyResponse(BaseModel):
    layer_name: str
    attachment_kes: float
    limit_kes: float
    share_pct: float
    layer_aal_kes: float
    rate_on_line_pct: float
    technical_pure_premium_kes: float
    recommended_treaty_premium_kes: float
    layer_event_outcomes: List[Dict[str, Any]]


class FacultativeQuoteRequest(BaseModel):
    tiv_kes: float = Field(..., gt=0, description="Total Insured Value in KES")
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    housing_class: HousingClass
    deductible_pct: float = Field(default=0.05, ge=0.0, le=0.5, description="Policy deductible percentage (e.g. 0.05 = 5%)")


class FacultativeQuoteResponse(BaseModel):
    tiv_kes: float
    lat: float
    lon: float
    housing_class: str
    deductible_pct: float
    deductible_kes: float
    asset_aal_gross_kes: float
    asset_aal_insured_kes: float
    pure_rate_pct: float
    recommended_technical_rate_pct: float
    recommended_annual_premium_kes: float
    depth_100y_m: float
    insured_loss_100y_kes: float


class AIChatRequest(BaseModel):
    message: str = Field(..., description="User query or underwriter prompt")
    history: Optional[List[Dict[str, str]]] = Field(default=None, description="Previous chat conversation history")


