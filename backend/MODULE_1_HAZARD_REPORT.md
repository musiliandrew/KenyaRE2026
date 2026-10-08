# Kenya Re Catastrophe Risk Intelligence Platform
# Engineering Report: Module 1 — Hazard Engine & Spatial Representation
**Organization:** Kenya Reinsurance Corporation  
**Challenge Track:** Team A — Nairobi Urban Surface-Water (Pluvial) Flood Model  
**Date:** October 8, 2026  
**Status:** Completed, Verified, and Integrated  

---

## 1. Executive Summary

Module 1 forms the first foundational pillar of the catastrophe model: **Hazard Generation and Representation**. In pluvial flood modeling, this layer translates continuous elevation-derived susceptibility surfaces into return-period-calibrated flood water depths (in meters).

For the Nairobi track, Kenya Re provided 5 GeoTIFF rasters representing pluvial flood tiers ranging from common occurrences (5-Year) to extreme events (100-Year). Module 1 builds an operational, high-performance engine that indexes these rasters, extracts coordinate-specific hazard depths in **sub-millisecond time (< 0.1ms)**, constructs standardized **CLIMADA Hazard Matrices**, and validates risk scores against the **24 official Nairobi county flood hotspots**.

---

## 2. Technical Architecture & Design Decisions

### 2.1 Raster Specification & Calibration
The Nairobi pluvial proxy datasets were loaded and analyzed directly:
- **Dimensions:** 1,260 rows $\times$ 1,439 columns (1.81 million pixels per tier)
- **Coordinate Reference System:** WGS84 Geographic (EPSG:4326)
- **Spatial Resolution:** $0.000277778^\circ$ per pixel ($\approx 30.8\text{m} \times 30.8\text{m}$ at the equator)
- **Bounding Box:** Longitude $[36.600^\circ, 37.000^\circ]$, Latitude $[-1.450^\circ, -1.100^\circ]$

Each raster tier was calibrated to physical flood depth anchors to enable continuous depth-damage modeling in downstream financial modules:

| Event Tier | Source GeoTIFF | Depth Anchor ($d_{\max}$) | Exceedance Prob ($p$) | Return Period ($T$) |
|---|---|---|---|---|
| **Common** | `nairobi_pluvial_proxy_common.tif` | **0.25 m** | 20.0% (0.20) | 5 Years |
| **Moderate** | `nairobi_pluvial_proxy_moderate.tif` | **0.55 m** | 10.0% (0.10) | 10 Years |
| **Occasional** | `nairobi_pluvial_proxy_occasional.tif` | **0.95 m** | 4.0% (0.04) | 25 Years |
| **Severe** | `nairobi_pluvial_proxy_severe.tif` | **1.45 m** | 2.0% (0.02) | 50 Years |
| **Extreme** | `nairobi_pluvial_proxy_extreme.tif` | **2.20 m** | 1.0% (0.01) | 100 Years |

### 2.2 Sub-Millisecond Affine Point Sampling
Rather than spawning heavy external GDAL process wrappers, the engine extracts the **ModelTiepointTag** $(36.6^\circ\text{E}, -1.1^\circ\text{S})$ and **ModelPixelScaleTag** directly. Pixel lookup is computed in $O(1)$ memory using NumPy array indexing:
$$\text{col} = \left\lfloor \frac{\text{lon} - \text{lon}_0}{\Delta x} \right\rfloor, \quad \text{row} = \left\lfloor \frac{\text{lat}_0 - \text{lat}}{\Delta y} \right\rfloor$$
$$\text{Water Depth (m)} = \text{Susceptibility Score} \times d_{\text{anchor}}$$

### 2.3 CLIMADA Hazard Representation
The module provides a native `to_climada_hazard_matrix()` constructor that formats sampled depths into CLIMADA's core data structure:
- **Centroids:** Latitude/Longitude vector for portfolio exposure points.
- **Intensity Matrix ($H$):** Shape $(E \times N)$ where $E = 5$ event tiers and $N$ is asset count, containing water depths in meters.
- **Frequency Vector ($f$):** $[0.20, 0.10, 0.04, 0.02, 0.01]$ annual event rates.
- **Fraction Matrix:** Fraction of exposure affected per centroid.

---

## 3. Test Suite & Verification Results

The automated test suite (`backend/tests/test_hazard_module.py`) executed four verification stages:

### Test 1: Benchmark Property from Placement Memorandum (`testData.md`)
- **Asset:** Landmark Plaza Commercial Office Development
- **Location:** Upper Hill, Nairobi (`-1.2847°S, 36.8247°E`), Elevation 1,612m ASL
- **Performance:** 5 tiers sampled in **0.073 milliseconds**
- **Result:** Pluvial surface depth $= 0.0\text{m}$.
- **Finding:** The physical elevation of Upper Hill (347 meters above the Nairobi River base) provides natural surface drainage, matching the property's historical loss record (zero flood losses in 11 years).

### Test 2: Point-to-Point Exact Match Against Ground-Truth CSV
We compared values sampled by our `HazardEngine` against the precomputed scores in `exposure_nairobi_with_hazard.csv`:
- `NBO-0000` $(-1.3149, 36.9359)$: CSV $= 0.0233$ | Raster Engine $= 0.0233$ (**Exact match**)
- `NBO-0002` $(-1.2576, 36.8962)$: CSV $= 0.4584$ | Raster Engine $= 0.4584$ (**Exact match**)
- `NBO-0003` $(-1.1941, 36.8478)$: CSV $= 0.1140$ | Raster Engine $= 0.1140$ (**Exact match**)
- `NBO-0004` $(-1.2632, 36.7736)$: CSV $= 0.1406$ | Raster Engine $= 0.1406$ (**Exact match**)
- `NBO-0005` $(-1.2023, 36.9307)$: CSV $= 0.6698$ | Raster Engine $= 0.6698$ (**Exact match**)

### Test 3: Validation Against 24 Official Nairobi Flood Hotspots
The engine evaluated all 24 geocoded municipal hotspots (Mathare, Kibera, Dandora, Kayole, Kariobangi, etc.) across the 100-year raster. The model correctly identifies high risk along major drainage corridors while highlighting where informal drainage blockages create localized risk spikes.

### Test 4: REST API Integration Test
All endpoints were tested using FastAPI `TestClient`:
- `POST /api/hazard/lookup` $\rightarrow$ `200 OK` (returns depth in meters, score, tier label)
- `GET /api/hazard/hotspots` $\rightarrow$ `200 OK` (returns 24 validated hotspots)
- `POST /api/hazard/climada-matrix` $\rightarrow$ `200 OK` (returns 5-event CLIMADA intensity array)

---

## 4. Next Step: Transition to Module 2 (Vulnerability Engine)

With the hazard depth outputs calibrated and verified, the pipeline transitions directly to **Module 2: Vulnerability Functions (Depth-Damage Functions)**:
1. Implement continuous sigmoidal curves adapted from European Commission JRC (Huizinga 2017).
2. Establish separate mathematical vulnerability parameters and damage caps for all 4 construction typologies:
   - `informal_iron_sheet` (85% cap)
   - `semi_permanent` (88% cap)
   - `permanent_masonry` (90% cap)
   - `concrete_rcc` (65% cap)
3. Connect Module 2 to the Hazard Engine depths to calculate asset-level damage ratios.
