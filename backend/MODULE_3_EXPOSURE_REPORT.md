# Kenya Re Catastrophe Risk Intelligence Platform
# Engineering Report: Module 3 — Exposure Ingestion, Validation & Spatial Matching
**Organization:** Kenya Reinsurance Corporation  
**Challenge Track:** Team A — Nairobi Urban Surface-Water (Pluvial) Flood Model  
**Date:** October 8, 2026  
**Status:** Completed, Verified, and Integrated  

---

## 1. Executive Summary

Module 3 delivers the third critical pillar of catastrophe risk modeling: **Exposure Ingestion and Spatial Matching**. This layer manages asset portfolios, validates building geometries against Oasis Open Exposure Data (OED) standards, indexes assets into administrative wards, joins properties to the raster hazard layer in sub-millisecond time, and exports data into CLIMADA Entity specifications.

---

## 2. Technical Architecture & Ingestion Pipeline

### 2.1 Baseline Nairobi Exposure Portfolio (`exposure_nairobi_with_hazard.csv`)
The ground-truth portfolio was ingested, cleaned, and summarized:
- **Total Portfolio Assets:** 600 geocoded properties
- **Total Insured Value (TIV):** **KES 63,635,075,000.00** (~KES 63.6B)
- **Bounding Box:** Latitude $[-1.3486^\circ, -1.1801^\circ]$, Longitude $[36.7007^\circ, 36.9499^\circ]$

### 2.2 Capital Allocation Across Housing Typologies

| Housing Typology | Property Count | Portfolio Share (%) | Total Insured Value (KES) | TIV Share (%) |
|---|---|---|---|---|
| **Informal (Iron Sheet)** | 179 | 29.8% | KES 198,110,000.00 | 0.31% |
| **Semi-Permanent** | 181 | 30.2% | KES 850,710,000.00 | 1.34% |
| **Permanent Masonry** | 156 | 26.0% | KES 8,451,170,000.00 | 13.28% |
| **Concrete Frame (RCC)** | 84 | 14.0% | KES 54,135,085,000.00 | 85.07% |
| **Total** | **600** | **100.0%** | **KES 63,635,075,000.00** | **100.0%** |

*Actuarial Finding:* While informal and semi-permanent structures account for **60% of property count**, they represent under **2% of capital exposure**. Concrete RCC commercial assets represent only **14% of buildings** but account for **85% of total capital at risk**.

### 2.3 Spatial Administrative Ward Matching
The engine automatically assigns properties to 11 key administrative localities using closest Euclidean centroid matching:
- *Mathare, Kibera, Dandora, Westlands, Upper Hill / CBD, Kariobangi, Kayole, Kawangware, Lang'ata, Kasarani, and Embakasi.*

### 2.4 Vectorized Raster Hazard Joining
By coupling `ExposureEngine` with Module 1's `HazardEngine`, all 600 portfolio coordinates are joined to the 5 GeoTIFF rasters in **2.14 milliseconds** ($\approx 0.0036\text{ms}$ per asset).

### 2.5 Oasis OED Validation & Single-Slip Ingestion (`testData.md`)
Custom portfolio uploads (`/api/portfolio/upload`) are validated against:
1. Strict bounding box boundaries within Nairobi (`[-1.45, -1.15]` lat, `[36.65, 37.15]` lon).
2. Physical non-negative floor areas and positive TIVs.
3. Standardized housing typology mapping.
- **Test Case Verified:** Landmark Plaza Commercial Office (Upper Hill, KES 1.09B TIV, 24,500 m², RCC Grade A+) was ingested, normalized, and classified under the `Upper Hill / CBD` administrative ward.

### 2.6 CLIMADA Exposures / Entity Integration
The engine exports a native CLIMADA `Exposures` schema:
- `value`: Array of TIV floats
- `latitude` / `longitude`: Coordinate vectors
- `housing_classes`: Typology tags
- `currency`: "KES"

---

## 3. Test Suite & Verification Results

The automated test suite (`backend/tests/test_exposure_module.py`) executed five verification stages:
1. **Baseline Ingestion:** 600 assets loaded, KES 63.6B TIV verified.
2. **Capital Breakdown:** Exact counts and TIV distributions confirmed across all 4 classes.
3. **Sub-millisecond Spatial Matching:** 600 assets matched to the 100-year raster in **2.14 ms**.
4. **Oasis OED Validation:** Ingested Landmark Plaza successfully while rejecting out-of-boundary records.
5. **CLIMADA Entity Export:** Exported valid 600-element arrays compatible with CLIMADA `Impact` models.

---

## 4. API Endpoints Delivered
- `GET /api/portfolio/summary`: Real-time executive metrics for active return period.
- `GET /api/exposure/assets`: Geocoded properties enriched with spatial hazard depth and wards.
- `GET /api/exposure/stats`: Capital breakdown by class and ward.
- `GET /api/exposure/climada-entity`: Native CLIMADA Exposures dictionary.
- `POST /api/portfolio/upload`: Oasis OED upload and validation endpoint.
