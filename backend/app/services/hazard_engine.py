"""
Kenya Re Catastrophe Risk Intelligence Platform · Pillar 1: Hazard Engine
========================================================================
Implements CLIMADA-compatible Hazard representation for Nairobi Urban Pluvial Floods:
- Loads the 5 pluvial proxy GeoTIFF tiers (5y Common to 100y Extreme).
- Provides sub-millisecond point-sampling for latitude/longitude coordinates.
- Validates model hazard performance against the 24 official county flood hotspots.
- Fully compatible with CLIMADA Centroids, Hazard intensity matrices, and OED inputs.
"""

import os
import math
import numpy as np
import tifffile
from typing import Dict, List, Optional, Tuple, Any

# Map return period keys to filename identifiers, depth anchors, and labels
HAZARD_TIER_CONFIG = {
    "5y": {
        "filename": "nairobi_pluvial_proxy_common.tif",
        "depth_anchor_m": 0.25,
        "label": "5-Year (Common Pluvial)",
        "rp_years": 5,
        "annual_exceedance_prob": 0.20,
    },
    "10y": {
        "filename": "nairobi_pluvial_proxy_moderate.tif",
        "depth_anchor_m": 0.55,
        "label": "10-Year (Moderate Pluvial)",
        "rp_years": 10,
        "annual_exceedance_prob": 0.10,
    },
    "25y": {
        "filename": "nairobi_pluvial_proxy_occasional.tif",
        "depth_anchor_m": 0.95,
        "label": "25-Year (Occasional Pluvial)",
        "rp_years": 25,
        "annual_exceedance_prob": 0.04,
    },
    "50y": {
        "filename": "nairobi_pluvial_proxy_severe.tif",
        "depth_anchor_m": 1.45,
        "label": "50-Year (Severe Pluvial)",
        "rp_years": 50,
        "annual_exceedance_prob": 0.02,
    },
    "100y": {
        "filename": "nairobi_pluvial_proxy_extreme.tif",
        "depth_anchor_m": 2.20,
        "label": "100-Year (Extreme Pluvial)",
        "rp_years": 100,
        "annual_exceedance_prob": 0.01,
    },
}

DEFAULT_RASTER_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "team_a_nairobi", "team_a_nairobi")
)


class HazardRaster:
    """Represents a single georeferenced flood hazard raster layer."""

    def __init__(self, filepath: str, return_period: str):
        self.filepath = filepath
        self.return_period = return_period
        self.config = HAZARD_TIER_CONFIG.get(return_period, {})
        self.depth_anchor = self.config.get("depth_anchor_m", 1.0)
        self.data: Optional[np.ndarray] = None
        self.origin_lon = 36.6
        self.origin_lat = -1.1
        self.pixel_size_x = 0.0002777777777777778
        self.pixel_size_y = 0.0002777777777777778
        self.height = 0
        self.width = 0
        self._load()

    def _load(self):
        """Loads array and extracts GeoTIFF affine transform metadata."""
        if not os.path.exists(self.filepath):
            raise FileNotFoundError(f"Hazard raster not found: {self.filepath}")

        with tifffile.TiffFile(self.filepath) as tif:
            page = tif.pages[0]
            tags = {tag.name: tag.value for tag in page.tags}
            self.data = tif.asarray()
            self.height, self.width = self.data.shape

            # Parse GeoTIFF Tiepoint Tag (ModelTiepointTag: I, J, K, X, Y, Z)
            tiepoint = tags.get("ModelTiepointTag")
            if tiepoint and len(tiepoint) >= 5:
                self.origin_lon = float(tiepoint[3])
                self.origin_lat = float(tiepoint[4])

            # Parse Pixel Scale Tag (ModelPixelScaleTag: ScaleX, ScaleY, ScaleZ)
            scale = tags.get("ModelPixelScaleTag")
            if scale and len(scale) >= 2:
                self.pixel_size_x = float(scale[0])
                self.pixel_size_y = float(scale[1])

    def sample_point(self, lat: float, lon: float) -> Tuple[float, float]:
        """
        Samples hazard raster at (lat, lon).
        Returns:
            Tuple[float, float]: (susceptibility_score [0..1], flood_depth_m)
        """
        if self.data is None:
            return 0.0, 0.0

        # Calculate raster row and col index from coordinates
        col = int((lon - self.origin_lon) / self.pixel_size_x)
        row = int((self.origin_lat - lat) / self.pixel_size_y)

        # Check raster bounds (outside Nairobi bounding box is dry ground)
        if 0 <= row < self.height and 0 <= col < self.width:
            val = float(self.data[row, col])
            # Handle possible nodata or negative values
            score = max(0.0, min(1.0, val)) if not np.isnan(val) else 0.0
            depth_m = round(score * self.depth_anchor, 3)
            return round(score, 4), depth_m
        return 0.0, 0.0


class HazardEngine:
    """
    Module 1: Nairobi Pluvial Surface-Water Hazard Engine.
    Manages all return-period rasters, coordinate sampling, and validation against hotspots.
    """

    def __init__(self, raster_dir: str = DEFAULT_RASTER_DIR):
        self.raster_dir = raster_dir
        self.rasters: Dict[str, HazardRaster] = {}
        self.loaded = False
        self.initialize_rasters()

    def initialize_rasters(self):
        """Loads and indexes the 5 return period GeoTIFF rasters."""
        for rp, cfg in HAZARD_TIER_CONFIG.items():
            path = os.path.join(self.raster_dir, cfg["filename"])
            if os.path.exists(path):
                self.rasters[rp] = HazardRaster(path, rp)
        self.loaded = len(self.rasters) > 0

    def get_hazard_depth(self, lat: float, lon: float, return_period: str = "100y") -> Dict[str, Any]:
        """
        Samples susceptibility score and equivalent water depth at a coordinate.
        """
        rp = return_period.lower()
        if rp not in self.rasters:
            rp = "100y"

        raster = self.rasters.get(rp)
        cfg = HAZARD_TIER_CONFIG.get(rp, {})

        if raster:
            score, depth_m = raster.sample_point(lat, lon)
        else:
            score, depth_m = 0.0, 0.0

        return {
            "lat": lat,
            "lon": lon,
            "return_period": rp,
            "hazard_score": score,
            "depth_m": depth_m,
            "tier_label": cfg.get("label", "Unknown Tier"),
            "depth_anchor_m": cfg.get("depth_anchor_m", 2.20),
            "annual_exceedance_prob": cfg.get("annual_exceedance_prob", 0.01),
        }

    def sample_all_tiers(self, lat: float, lon: float) -> Dict[str, Dict[str, Any]]:
        """Samples all 5 event tiers for a single asset (returns full hazard profile)."""
        return {rp: self.get_hazard_depth(lat, lon, rp) for rp in HAZARD_TIER_CONFIG}

    def get_hazard_grid(
        self,
        return_period: str = "100y",
        bbox: Tuple[float, float, float, float] = (-1.45, 36.65, -1.15, 37.15),
        step: int = 12,
        min_depth_m: float = 0.05,
    ) -> Dict[str, Any]:
        """
        Returns a downsampled grid of wet cells (depth >= min_depth_m) for map rendering.
        bbox = (lat_min, lon_min, lat_max, lon_max); step = raster cells per output cell.
        """
        rp = return_period.lower()
        raster = self.rasters.get(rp) or self.rasters.get("100y")
        if raster is None or raster.data is None:
            return {"return_period": rp, "cell_size_deg": 0.0, "count": 0, "cells": []}

        lat_min, lon_min, lat_max, lon_max = bbox
        row_start = max(0, int((raster.origin_lat - lat_max) / raster.pixel_size_y))
        row_end = min(raster.height, int((raster.origin_lat - lat_min) / raster.pixel_size_y))
        col_start = max(0, int((lon_min - raster.origin_lon) / raster.pixel_size_x))
        col_end = min(raster.width, int((lon_max - raster.origin_lon) / raster.pixel_size_x))

        block = np.nan_to_num(raster.data[row_start:row_end, col_start:col_end].astype(np.float32), nan=0.0)
        block = np.clip(block, 0.0, 1.0)
        h = (block.shape[0] // step) * step
        w = (block.shape[1] // step) * step
        if h == 0 or w == 0:
            return {"return_period": rp, "cell_size_deg": 0.0, "count": 0, "cells": []}
        pooled = block[:h, :w].reshape(h // step, step, w // step, step).mean(axis=(1, 3))

        anchor = raster.depth_anchor
        rows, cols = np.nonzero(pooled * anchor >= min_depth_m)
        cells = []
        for r, c in zip(rows, cols):
            score = float(pooled[r, c])
            lat = raster.origin_lat - (row_start + (r + 0.5) * step) * raster.pixel_size_y
            lon = raster.origin_lon + (col_start + (c + 0.5) * step) * raster.pixel_size_x
            cells.append({
                "lat": round(lat, 5),
                "lon": round(lon, 5),
                "score": round(score, 3),
                "depth_m": round(score * anchor, 3),
            })
        return {
            "return_period": rp,
            "cell_size_deg": round(step * raster.pixel_size_x, 6),
            "count": len(cells),
            "cells": cells,
        }

    def validate_hotspots(self, hotspots: List[Dict[str, Any]], return_period: str = "100y") -> List[Dict[str, Any]]:
        """
        Evaluates model depth & susceptibility across official county flood hotspots.
        """
        results = []
        for h in hotspots:
            name = h.get("name", "Unknown")
            lat = float(h.get("lat", 0.0))
            lon = float(h.get("lon", 0.0))
            res = self.get_hazard_depth(lat, lon, return_period)
            results.append({
                "name": name,
                "lat": lat,
                "lon": lon,
                "hazard_score": res["hazard_score"],
                "depth_m": res["depth_m"],
                "tier_label": res["tier_label"],
                "status": "High Exposure" if res["hazard_score"] > 0.4 else "Moderate/Low",
            })
        return results

    def to_climada_hazard_matrix(self, coordinates: List[Tuple[float, float]], return_periods: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Formats sampled raster depths into CLIMADA Hazard matrix structure:
        - centroids: (lat, lon) coordinates
        - intensity: matrix (events x centroids) of flood depths in meters
        - fraction: matrix of exposure fraction affected
        - frequency: annual event occurrence rates [0.20, 0.10, 0.04, 0.02, 0.01]
        """
        rps = return_periods or list(HAZARD_TIER_CONFIG.keys())
        n_events = len(rps)
        n_centroids = len(coordinates)

        intensity_matrix = np.zeros((n_events, n_centroids), dtype=np.float32)
        fractions_matrix = np.ones((n_events, n_centroids), dtype=np.float32)
        frequencies = np.array([HAZARD_TIER_CONFIG[rp]["annual_exceedance_prob"] for rp in rps], dtype=np.float32)

        for event_idx, rp in enumerate(rps):
            raster = self.rasters.get(rp)
            if not raster:
                continue
            for c_idx, (lat, lon) in enumerate(coordinates):
                _, depth_m = raster.sample_point(lat, lon)
                intensity_matrix[event_idx, c_idx] = depth_m

        return {
            "climada_compatible": True,
            "n_events": n_events,
            "n_centroids": n_centroids,
            "events": rps,
            "frequency": frequencies.tolist(),
            "intensity_shape": intensity_matrix.shape,
            "intensity_matrix": intensity_matrix,
            "fraction_matrix": fractions_matrix,
        }


# Global singleton instance for high-speed API re-use
hazard_engine = HazardEngine()

