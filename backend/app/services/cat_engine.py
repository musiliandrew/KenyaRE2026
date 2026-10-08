import math
import numpy as np
from typing import Dict, List, Tuple
from app.models.schemas import HousingClass, ReturnPeriod


# Return period calibrated flood depth anchors for Nairobi Pluvial Surface Water
RP_DEPTH_ANCHORS = {
    "5y": 0.25,    # Common
    "10y": 0.55,   # Moderate
    "25y": 0.95,   # Occasional
    "50y": 1.45,   # Severe
    "100y": 2.20,  # Extreme
}

# Tier labels for UI
RP_LABELS = {
    "5y": "Common",
    "10y": "Moderate",
    "25y": "Occasional",
    "50y": "Severe",
    "100y": "Extreme",
}

# Annual exceedance probabilities
RP_PROBABILITIES = {
    "5y": 0.20,
    "10y": 0.10,
    "25y": 0.04,
    "50y": 0.02,
    "100y": 0.01,
}

# Damage curve parameters (sigmoid: cap / (1 + exp(-k * (x - midpoint))))
DAMAGE_CURVE_PARAMS = {
    HousingClass.informal_iron_sheet: {
        "cap": 0.85,
        "k": 3.2,
        "midpoint": 0.45,
        "threshold": 0.05,
        "description": "Fragile materials: rapid damage onset"
    },
    HousingClass.semi_permanent: {
        "cap": 0.88,
        "k": 2.5,
        "midpoint": 0.75,
        "threshold": 0.10,
        "description": "Moderate vulnerability: steady damage growth"
    },
    HousingClass.permanent_masonry: {
        "cap": 0.90,
        "k": 2.1,
        "midpoint": 1.15,
        "threshold": 0.25,
        "description": "Resilient construction: flood defense below 0.3m"
    },
    HousingClass.concrete_rcc: {
        "cap": 0.92,
        "k": 1.8,
        "midpoint": 1.50,
        "threshold": 0.30,
        "description": "Highly resilient: reinforced concrete"
    },
}


def calculate_jrc_damage_ratio(depth_m: float, housing_class: str) -> float:
    """
    Computes depth-damage ratio based on JRC / Huizinga (2017) continuous sigmoid curves,
    adapted for Nairobi housing typologies with physical loss caps.
    """
    if depth_m <= 0.05:
        return 0.0

    # Convert string to enum if needed
    if isinstance(housing_class, str):
        try:
            housing_class = HousingClass(housing_class)
        except ValueError:
            housing_class = HousingClass.informal_iron_sheet

    params = DAMAGE_CURVE_PARAMS.get(housing_class, DAMAGE_CURVE_PARAMS[HousingClass.informal_iron_sheet])
    
    if depth_m <= params["threshold"]:
        return 0.0

    x = max(0.0, depth_m - params["threshold"])
    raw = params["cap"] / (1.0 + math.exp(-params["k"] * (x - params["midpoint"])))
    return min(params["cap"], max(0.0, raw))


def calculate_asset_loss(tiv_kes: float, depth_m: float, housing_class: str) -> Dict[str, float]:
    """
    Computes damage ratio and financial loss for an individual building.
    """
    ratio = calculate_jrc_damage_ratio(depth_m, housing_class)
    loss = tiv_kes * ratio
    
    # Get damage cap for this housing class
    if isinstance(housing_class, str):
        try:
            housing_class = HousingClass(housing_class)
        except ValueError:
            housing_class = HousingClass.informal_iron_sheet
    
    cap = DAMAGE_CURVE_PARAMS.get(housing_class, DAMAGE_CURVE_PARAMS[HousingClass.informal_iron_sheet])["cap"]
    
    return {
        "damage_ratio": round(ratio, 4),
        "loss_kes": round(loss, 2),
        "damage_cap_pct": round(cap * 100, 1)
    }

def calculate_portfolio_loss(
    assets: List[Dict],
    return_period: str = "100y",
    apply_ai: bool = True
) -> Dict:
    """
    Calculates portfolio loss for a given return period.
    Applies AI drainage gap adjustments if enabled.
    """
    depth_m = RP_DEPTH_ANCHORS.get(return_period, 2.20)
    total_tiv = sum(asset["tiv_kes"] for asset in assets)
    total_loss = 0.0
    loss_by_class = {}
    asset_losses = []
    
    for asset in assets:
        housing_class = asset.get("housing_class", "informal_iron_sheet")
        tiv = asset["tiv_kes"]
        
        # Apply AI drainage penalty if enabled
        effective_depth = depth_m
        if apply_ai and asset.get("drainage_penalty", 0) > 0:
            effective_depth = depth_m * (1.0 + asset["drainage_penalty"])
        
        result = calculate_asset_loss(tiv, effective_depth, housing_class)
        loss = result["loss_kes"]
        
        total_loss += loss
        
        # Track by class
        if housing_class not in loss_by_class:
            loss_by_class[housing_class] = 0.0
        loss_by_class[housing_class] += loss
        
        # Track individual asset losses
        asset_losses.append({
            "id": asset["id"],
            "name": asset.get("name", "Unknown"),
            "housing_class": housing_class,
            "tiv_kes": tiv,
            "loss_kes": loss,
            "damage_ratio": result["damage_ratio"]
        })
    
    # Sort by loss and get top 10
    asset_losses.sort(key=lambda x: x["loss_kes"], reverse=True)
    top_losses = asset_losses[:10]
    
    return {
        "total_tiv_kes": total_tiv,
        "portfolio_loss_kes": total_loss,
        "loss_ratio": total_loss / total_tiv if total_tiv > 0 else 0.0,
        "loss_by_class": loss_by_class,
        "top_losses": top_losses,
        "asset_count": len(assets)
    }


def compute_ep_curve(
    assets: List[Dict],
    apply_ai: bool = True
) -> List[Dict]:
    """
    Computes the full Exceedance Probability (EP) curve across all return periods.
    """
    metrics = []
    total_tiv = sum(asset["tiv_kes"] for asset in assets)
    
    for rp in ["5y", "10y", "25y", "50y", "100y"]:
        result = calculate_portfolio_loss(assets, rp, apply_ai)
        
        # Calculate PML at 90% confidence (simplified: 1.15x mean loss)
        pml_90 = result["portfolio_loss_kes"] * 1.15
        
        # Calculate AI delta if enabled
        ai_delta = None
        ai_adjusted = None
        if apply_ai:
            result_no_ai = calculate_portfolio_loss(assets, rp, False)
            ai_delta = result["portfolio_loss_kes"] - result_no_ai["portfolio_loss_kes"]
            ai_adjusted = result["portfolio_loss_kes"]
        
        metric = {
            "return_period": rp,
            "years": int(rp.replace("y", "")),
            "annual_prob": RP_PROBABILITIES[rp],
            "portfolio_loss_kes": result["portfolio_loss_kes"],
            "loss_ratio": result["loss_ratio"],
            "pml_90": pml_90,
            "ai_adjusted_loss": ai_adjusted,
            "ai_delta_kes": ai_delta
        }
        metrics.append(metric)
    
    return metrics


def calculate_aal(assets: List[Dict], apply_ai: bool = True) -> float:
    """
    Calculates Average Annual Loss (AAL) by integrating the EP curve.
    Simplified: weighted average of losses by annual probability.
    """
    ep_curve = compute_ep_curve(assets, apply_ai)
    aal = sum(m["portfolio_loss_kes"] * m["annual_prob"] for m in ep_curve)
    return aal


def lookup_hazard_score(lat: float, lng: float, return_period: str) -> Dict:
    """
    Simulates hazard lookup from raster data.
    In production, this would use Rasterio to sample from GeoTIFF files.
    For now, returns a proxy score based on location and return period.
    """
    base_score = 0.3 + (RP_DEPTH_ANCHORS.get(return_period, 2.20) / 3.0)
    spatial_factor = (math.sin(lat * 10) + math.cos(lng * 10)) * 0.1
    hazard_score = max(0.0, min(1.0, base_score + spatial_factor))
    depth_m = RP_DEPTH_ANCHORS.get(return_period, 2.20)
    
    return {
        "lat": lat,
        "lng": lng,
        "return_period": return_period,
        "hazard_score": round(hazard_score, 3),
        "depth_m": depth_m,
        "tier_label": RP_LABELS.get(return_period, "Unknown")
    }


def apply_ai_drainage_adjustments(assets: List[Dict]) -> List[Dict]:
    """
    Applies AI-detected drainage gap penalties to exposure assets.
    Simulates AI analysis of drainage infrastructure gaps.
    """
    for asset in assets:
        lat = asset.get("lat", 0)
        lng = asset.get("lng", 0)
        river_proximity = abs(math.sin(lat * 5) * math.cos(lng * 5))
        
        if river_proximity > 0.7:
            asset["drainage_penalty"] = 0.15
        elif river_proximity > 0.4:
            asset["drainage_penalty"] = 0.08
        else:
            asset["drainage_penalty"] = 0.0
    
    return assets
