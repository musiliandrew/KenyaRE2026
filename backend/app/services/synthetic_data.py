import os
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
    Returns official Nairobi flood hotspots.
    Loads from nairobi_hotspots_geocoded.csv (24 validation points) if available.
    """
    csv_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "team_a_nairobi", "team_a_nairobi", "nairobi_hotspots_geocoded.csv")
    )
    if os.path.exists(csv_path):
        import pandas as pd
        df = pd.read_csv(csv_path)
        return df.rename(columns={"lon": "lng"}).to_dict(orient="records")

    return [
        {"name": "Kiambiu", "lat": -1.2822758, "lng": 36.8634101},
        {"name": "Dandora", "lat": -1.2449083, "lng": 36.9060802},
        {"name": "Kariobangi", "lat": -1.2590939, "lng": 36.8819135},
        {"name": "Kayole", "lat": -1.2667475, "lng": 36.9193623},
        {"name": "Komarock", "lat": -1.2726556, "lng": 36.9077371},
        {"name": "Njiru", "lat": -1.2545703, "lng": 36.9920563},
        {"name": "Ruai", "lat": -1.2689967, "lng": 36.9915483},
        {"name": "Mwiki", "lat": -1.2327573, "lng": 36.9332678},
        {"name": "Donholm", "lat": -1.2992254, "lng": 36.8886888},
        {"name": "Tassia", "lat": -1.307049, "lng": 36.8986034},
        {"name": "Fedha", "lat": -1.3156695, "lng": 36.8984952},
        {"name": "Madaraka", "lat": -1.3074039, "lng": 36.8153361},
        {"name": "Nairobi West", "lat": -1.3087022, "lng": 36.8230975},
        {"name": "Lang'ata", "lat": -1.3189569, "lng": 36.7899763},
        {"name": "Kawangware", "lat": -1.2784631, "lng": 36.751643},
        {"name": "Kangemi", "lat": -1.2680073, "lng": 36.7522966},
        {"name": "Lavington", "lat": -1.2740678, "lng": 36.7762269},
        {"name": "Westlands", "lat": -1.2465281, "lng": 36.7860759},
        {"name": "Parklands", "lat": -1.2630616, "lng": 36.8106288},
        {"name": "Kitisuru", "lat": -1.2403787, "lng": 36.77103},
        {"name": "Kileleshwa", "lat": -1.2767338, "lng": 36.7879011},
        {"name": "Chiromo", "lat": -1.2708313, "lng": 36.8063848},
        {"name": "Mathare", "lat": -1.2584151, "lng": 36.8712653},
    ]


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
