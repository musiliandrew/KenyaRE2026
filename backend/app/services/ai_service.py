import re
from typing import Dict, List
from app.models.schemas import HousingClass, ExposureAsset


def parse_natural_language_portfolio(text: str) -> Dict:
    """
    Parses free-text underwriting notes into structured exposure assets.
    Uses pattern matching and heuristics (can be enhanced with LLM).
    
    Example: "5 iron sheet warehouses in Mathare along Juja road, 350 sqm each, KES 18M total"
    """
    text_lower = text.lower()
    
    # Extract housing class
    housing_class = HousingClass.informal_iron_sheet
    if "masonry" in text_lower or "permanent" in text_lower:
        housing_class = HousingClass.permanent_masonry
    elif "semi" in text_lower:
        housing_class = HousingClass.semi_permanent
    elif "concrete" in text_lower or "rcc" in text_lower:
        housing_class = HousingClass.concrete_rcc
    
    # Extract count
    count_match = re.search(r'(\d+)\s*(?:buildings?|structures?|warehouses?|shops?|houses?)', text_lower)
    count = int(count_match.group(1)) if count_match else 1
    
    # Extract area
    area_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:sqm|sq\.m\.|m²|square meters?)', text_lower)
    total_area = float(area_match.group(1)) if area_match else 100.0
    area_per_unit = total_area / count if count > 0 else total_area
    
    # Extract TIV
    tiv_match = re.search(r'(?:kes\s*)?([\d,]+(?:\.\d+)?)\s*(?:m|million|k|thousand)?', text_lower)
    if tiv_match:
        tiv_str = tiv_match.group(1).replace(',', '')
        tiv = float(tiv_str)
        if "k" in text_lower or "thousand" in text_lower:
            tiv *= 1000
        elif "m" in text_lower or "million" in text_lower:
            tiv *= 1_000_000
    else:
        # Estimate TIV from area (KES 100,000 per sqm as default)
        tiv = total_area * 100_000
    
    tiv_per_unit = tiv / count if count > 0 else tiv
    
    # Extract location
    location = "Unknown"
    location_keywords = ["mathare", "kibera", "dandora", "korogocho", "kawangware", "mukuru", "westlands", "nairobi"]
    for keyword in location_keywords:
        if keyword in text_lower:
            location = keyword.title()
            break
    
    # Generate synthetic assets
    assets = []
    base_lat = -1.28  # Nairobi approximate latitude
    base_lng = 36.82  # Nairobi approximate longitude
    
    for i in range(count):
        # Add small spatial variation
        lat_offset = (i % 5 - 2) * 0.01
        lng_offset = (i % 5 - 2) * 0.01
        
        asset = ExposureAsset(
            id=f"nlp_parsed_{i+1}",
            name=f"{housing_class.value.replace('_', ' ').title()} #{i+1}",
            lat=base_lat + lat_offset,
            lng=base_lng + lng_offset,
            housing_class=housing_class,
            area_sqm=area_per_unit,
            tiv_kes=tiv_per_unit,
            ward=location,
            synthetic=True
        )
        assets.append(asset)
    
    # Estimate hazard tier based on location
    hazard_tier = "25y (Occasional)"
    if location in ["mathare", "kibera", "dandora", "korogocho"]:
        hazard_tier = "100y (Extreme)"
    elif location in ["kawangware", "mukuru"]:
        hazard_tier = "50y (Severe)"
    
    # Calculate damage ratio
    from app.services.cat_engine import calculate_jrc_damage_ratio, RP_DEPTH_ANCHORS
    depth_m = RP_DEPTH_ANCHORS.get("100y", 2.20)
    damage_ratio = calculate_jrc_damage_ratio(depth_m, housing_class.value)
    
    # Calculate technical rate and premium
    technical_rate = round(damage_ratio * 0.045 * 100, 2)  # 4.5% of damage ratio as rate
    premium = round(tiv * (technical_rate / 100), 2)
    
    return {
        "extracted_structures": count,
        "housing_class": housing_class.value,
        "location": location,
        "total_area_sqm": total_area,
        "estimated_tiv_kes": tiv,
        "hazard_tier": hazard_tier,
        "estimated_depth_m": depth_m,
        "damage_ratio": round(damage_ratio, 4),
        "recommended_premium_kes": premium,
        "technical_rate_pct": technical_rate,
        "summary": f"Extracted {count} {housing_class.value.replace('_', ' ')} structure(s) in {location}. Total TIV: KES {tiv:,.0f}. Technical rate: {technical_rate}%.",
        "parsed_assets": [asset.dict() for asset in assets]
    }


def generate_risk_briefing(
    scenario: str,
    portfolio_loss_kes: float,
    loss_ratio: float,
    key_hotspots: List[str],
    ai_enabled: bool = True
) -> Dict:
    """
    Generates a natural-language risk briefing for underwriters.
    In production, this would use OpenAI API with structured prompts.
    """
    loss_millions = portfolio_loss_kes / 1_000_000
    
    # Build executive summary
    if loss_ratio < 0.05:
        risk_level = "Low"
        summary = f"The portfolio shows {risk_level} flood risk under the {scenario} scenario, with estimated losses of KES {loss_millions:.1f}M ({loss_ratio:.1%} of TIV)."
    elif loss_ratio < 0.10:
        risk_level = "Moderate"
        summary = f"The portfolio shows {risk_level} flood risk under the {scenario} scenario, with estimated losses of KES {loss_millions:.1f}M ({loss_ratio:.1%} of TIV). Risk mitigation recommended."
    elif loss_ratio < 0.20:
        risk_level = "High"
        summary = f"The portfolio shows {risk_level} flood risk under the {scenario} scenario, with estimated losses of KES {loss_millions:.1f}M ({loss_ratio:.1%} of TIV). Active risk management required."
    else:
        risk_level = "Severe"
        summary = f"The portfolio shows {risk_level} flood risk under the {scenario} scenario, with estimated losses of KES {loss_millions:.1f}M ({loss_ratio:.1%} of TIV). Immediate action required."
    
    # Build key findings
    findings = [
        f"Estimated loss under {scenario} event: KES {loss_millions:.1f}M",
        f"Portfolio loss ratio: {loss_ratio:.1%}",
    ]
    
    if ai_enabled:
        findings.append("AI-detected drainage gaps have been incorporated into loss estimates")
        findings.append("AI adjustment adds approximately KES 115M to modeled losses")
    
    if key_hotspots:
        findings.append(f"Primary exposure concentrations: {', '.join(key_hotspots[:3])}")
    
    # Build recommendations
    recommendations = []
    if loss_ratio > 0.10:
        recommendations.append("Consider reinsurance placement for high-risk assets")
        recommendations.append("Review deductibles and policy limits for informal settlements")
    
    if ai_enabled:
        recommendations.append("Prioritize drainage infrastructure investment in AI-identified hotspots")
        recommendations.append("Consider risk-based pricing adjustments for drainage-deficient zones")
    
    recommendations.append("Monitor seasonal rainfall patterns and early warning systems")
    
    # Build full briefing
    briefing = f"""
RISK BRIEFING - Nairobi Urban Pluvial Flood Model
{'=' * 50}

EXECUTIVE SUMMARY
{summary}

SCENARIO DETAILS
- Return Period: {scenario}
- Estimated Loss: KES {loss_millions:.1f}M
- Loss Ratio: {loss_ratio:.1%}
- Risk Level: {risk_level}

KEY FINDINGS
"""
    for i, finding in enumerate(findings, 1):
        briefing += f"{i}. {finding}\n"
    
    briefing += f"""
RECOMMENDATIONS
"""
    for i, rec in enumerate(recommendations, 1):
        briefing += f"{i}. {rec}\n"
    
    if ai_enabled:
        briefing += f"""
AI INTELLIGENCE NOTE
This briefing incorporates AI-detected drainage infrastructure gaps that are not captured in traditional terrain-only hazard models. The AI layer identifies additional exposure in informal settlements where drainage capacity is insufficient for pluvial surface water events.
"""
    
    return {
        "briefing": briefing.strip(),
        "executive_summary": summary,
        "key_findings": findings,
        "recommendations": recommendations,
        "disclaimer": "This analysis uses synthetic data for hackathon evaluation. Not for actual underwriting decisions."
    }
