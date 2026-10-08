import math
from typing import Dict

# Return period calibrated flood depth anchors for Nairobi Pluvial Surface Water
RP_DEPTH_ANCHORS = {
    "5y": 0.25,    # Common
    "10y": 0.55,   # Moderate
    "25y": 0.95,   # Occasional
    "50y": 1.45,   # Severe
    "100y": 2.20,  # Extreme
}


def calculate_jrc_damage_ratio(depth_m: float, housing_class: str) -> float:
    """
    Computes depth-damage ratio based on JRC / Huizinga (2017) continuous sigmoid curves,
    adapted for Nairobi housing typologies with physical loss caps.
    """
    if depth_m <= 0.05:
        return 0.0

    if housing_class == "informal_iron_sheet":
        # Fragile materials: rapid damage onset starting at 0.1m, capped at 85%
        x = max(0.0, depth_m - 0.05)
        raw = 0.85 / (1.0 + math.exp(-3.2 * (x - 0.45)))
        return min(0.85, max(0.0, raw))

    elif housing_class == "semi_permanent":
        # Moderate vulnerability: steady damage growth up to 1.5m, capped at 88%
        x = max(0.0, depth_m - 0.1)
        raw = 0.88 / (1.0 + math.exp(-2.5 * (x - 0.75)))
        return min(0.88, max(0.0, raw))

    elif housing_class == "permanent_masonry":
        # Resilient construction: flood defense below 0.3m, gradual ramp, capped at 90%
        x = max(0.0, depth_m - 0.25)
        raw = 0.90 / (1.0 + math.exp(-2.1 * (x - 1.15)))
        return min(0.90, max(0.0, raw))

    # Default fallback
    return min(0.80, max(0.0, depth_m * 0.3))


def calculate_asset_loss(tiv_kes: float, depth_m: float, housing_class: str) -> Dict[str, float]:
    """
    Computes damage ratio and financial loss for an individual building.
    """
    ratio = calculate_jrc_damage_ratio(depth_m, housing_class)
    loss = tiv_kes * ratio
    return {
        "damage_ratio": round(ratio, 4),
        "loss_kes": round(loss, 2)
    }

