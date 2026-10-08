import random
from typing import List, Dict
from app.models.schemas import HousingClass, ExposureAsset


# Nairobi wards with approximate coordinates
NAIROBI_WARDS = [
    {"name": "Mathare", "lat": -1.263, "lng": 36.847},
    {"name": "Kibera", "lat": -1.312, "lng": 36.789},
    {"name": "Dandora", "lat": -1.247, "lng": 36.895},
    {"name": "Korogocho", "lat": -1.253, "lng": 36.912},
    {"name": "Kawangware", "lat": -1.278, "lng": 36.798},
    {"name": "Mukuru", "lat": -1.295, "lng": 36.845},
    {"name": "Westlands", "lat": -1.235, "lng": 36.812},
    {"name": "Kasarani", "lat": -1.221, "lng": 36.925},
    {"name": "Embakasi", "lat": -1.289, "lng": 36.945},
    {"name": "Langata", "lat": -1.335, "lng": 36.823},
]


def generate_synthetic_exposure(num_assets: int = 600) -> List[Dict]:
    """
    Generates synthetic exposure data for Nairobi buildings.
    Mimics the structure of real exposure CSV files.
    """
    assets = []
    
    # Housing class distribution (weighted toward informal for Nairobi)
    housing_weights = [
        (HousingClass.informal_iron_sheet, 0.55),
        (HousingClass.semi_permanent, 0.30),
        (HousingClass.permanent_masonry, 0.12),
        (HousingClass.concrete_rcc, 0.03),
    ]
    
    housing_classes = []
    for hc, weight in housing_weights:
        count = int(num_assets * weight)
        housing_classes.extend([hc] * count)
    
    # Fill remaining if rounding caused shortfall
    while len(housing_classes) < num_assets:
        housing_classes.append(HousingClass.informal_iron_sheet)
    
    for i in range(num_assets):
        # Select ward
        ward_data = random.choice(NAIROBI_WARDS)
        ward = ward_data["name"]
        
        # Add spatial variation around ward center
        lat_offset = random.uniform(-0.02, 0.02)
        lng_offset = random.uniform(-0.02, 0.02)
        lat = ward_data["lat"] + lat_offset
        lng = ward_data["lng"] + lng_offset
        
        # Select housing class
        housing_class = housing_classes[i] if i < len(housing_classes) else HousingClass.informal_iron_sheet
        
        # Generate area and TIV based on housing class
        if housing_class == HousingClass.informal_iron_sheet:
            area = random.uniform(30, 120)
            tiv_per_sqm = random.uniform(80_000, 150_000)
        elif housing_class == HousingClass.semi_permanent:
            area = random.uniform(50, 200)
            tiv_per_sqm = random.uniform(120_000, 200_000)
        elif housing_class == HousingClass.permanent_masonry:
            area = random.uniform(80, 300)
            tiv_per_sqm = random.uniform(180_000, 300_000)
        else:  # concrete_rcc
            area = random.uniform(100, 500)
            tiv_per_sqm = random.uniform(250_000, 400_000)
        
        tiv = area * tiv_per_sqm
        
        asset = {
            "id": f"BLD{i+1:04d}",
            "name": f"Building {i+1}",
            "lat": round(lat, 6),
            "lng": round(lng, 6),
            "housing_class": housing_class.value,
            "area_sqm": round(area, 2),
            "tiv_kes": round(tiv, 2),
            "ward": ward,
            "hazard_score": 0.0,
            "drainage_penalty": 0.0,
            "effective_hazard": 0.0,
            "loss_kes": 0.0,
            "damage_ratio": 0.0,
            "synthetic": True
        }
        
        assets.append(asset)
    
    return assets


def get_synthetic_hotspots() -> List[Dict]:
    """
    Returns synthetic hotspot data for Nairobi flood-prone areas.
    """
    hotspots = [
        {
            "id": "HS001",
            "name": "Mathare River Corridor",
            "lat": -1.263,
            "lng": 36.847,
            "risk_score": 0.92,
            "description": "High-density informal settlement along Mathare River with poor drainage",
            "estimated_affected": 8500,
        },
        {
            "id": "HS002",
            "name": "Kibera Nairobi Dam",
            "lat": -1.312,
            "lng": 36.789,
            "risk_score": 0.89,
            "description": "Informal settlement adjacent to Nairobi Dam with overflow risk",
            "estimated_affected": 12000,
        },
        {
            "id": "HS003",
            "name": "Dandora Phase 4",
            "lat": -1.247,
            "lng": 36.895,
            "risk_score": 0.85,
            "description": "Low-lying area with blocked drainage channels",
            "estimated_affected": 6200,
        },
        {
            "id": "HS004",
            "name": "Korogocho Viwandani",
            "lat": -1.253,
            "lng": 36.912,
            "risk_score": 0.87,
            "description": "Riverside informal settlement with limited flood defenses",
            "estimated_affected": 4800,
        },
        {
            "id": "HS005",
            "name": "Kawangware 56",
            "lat": -1.278,
            "lng": 36.798,
            "risk_score": 0.81,
            "description": "Informal settlement in natural drainage pathway",
            "estimated_affected": 5500,
        },
        {
            "id": "HS006",
            "name": "Mukuru kwa Njenga",
            "lat": -1.295,
            "lng": 36.845,
            "risk_score": 0.84,
            "description": "Large informal settlement with inadequate stormwater infrastructure",
            "estimated_affected": 9800,
        },
    ]
    
    return hotspots


# Global synthetic exposure cache
_synthetic_exposure = None


def get_synthetic_exposure() -> List[Dict]:
    """
    Returns cached synthetic exposure data, generating it if needed.
    """
    global _synthetic_exposure
    if _synthetic_exposure is None:
        _synthetic_exposure = generate_synthetic_exposure(600)
    return _synthetic_exposure


def reset_synthetic_exposure():
    """
    Resets the synthetic exposure cache (useful for testing).
    """
    global _synthetic_exposure
    _synthetic_exposure = None
