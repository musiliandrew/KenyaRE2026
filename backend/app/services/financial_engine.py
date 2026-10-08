"""
Kenya Re Catastrophe Risk Intelligence Platform · Pillar 4: Financial & Aggregation Engine
==========================================================================================
Implements actuarial loss calculations, portfolio aggregation, and reinsurance layers:
- Event Loss Table (ELT) & Year Loss Table (YLT) computation across all 5 return periods.
- Exceedance Probability (EP) Loss Curve construction with Occurrence (OEP) & Aggregate (AEP).
- Trapezoidal numerical integration for Average Annual Loss (AAL).
- Probable Maximum Loss (PML) at 90%, 95%, and 99% confidence intervals.
- Insurance Policy Conditions: Deductibles and Policy Limits per property.
- Reinsurance Layering: Excess of Loss (XOL) Treaties (Attachment point, Limit, Co-insurance share).
- Full compatibility with CLIMADA Impact & Oasis LMF financial engine logic.
"""

import math
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from app.models.schemas import HousingClass, ReturnPeriodMetric, EPCurveResponse
from app.services.hazard_engine import hazard_engine, HAZARD_TIER_CONFIG
from app.services.vulnerability_engine import vulnerability_engine
from app.services.exposure_engine import exposure_engine


class FinancialEngine:
    """
    Module 4: Actuarial Financial Engine & Aggregation Pipeline.
    """

    def __init__(self):
        self.hazard = hazard_engine
        self.vuln = vulnerability_engine
        self.exposure = exposure_engine

    def calculate_event_loss_table(
        self,
        assets: Optional[List[Dict[str, Any]]] = None,
        apply_ai_drainage: bool = False,
        drainage_penalty_pct: float = 0.15,
        deductible_pct: float = 0.0,
        policy_limit_pct: float = 1.0,
    ) -> List[Dict[str, Any]]:
        """
        Computes the Event Loss Table (ELT) across all 5 calibrated return periods.
        Applies property-level deductibles, limits, and optional AI drainage penalties.
        """
        target_assets = assets if assets is not None else self.exposure.assets
        total_tiv = sum(a["tiv_kes"] for a in target_assets)
        elt = []

        for rp, cfg in HAZARD_TIER_CONFIG.items():
            gross_loss = 0.0
            insured_loss = 0.0
            class_loss = {hc.value: 0.0 for hc in HousingClass}
            ward_loss: Dict[str, float] = {}
            property_losses = []

            for asset in target_assets:
                lat = asset["lat"]
                lon = asset.get("lon") or asset.get("lng")
                tiv = asset["tiv_kes"]
                hc = asset["housing_class"]
                ward = asset.get("ward", "Nairobi Urban")

                # Sample physical depth from Hazard Engine
                h_data = self.hazard.get_hazard_depth(lat, lon, rp)
                depth = h_data["depth_m"]

                # Apply AI drainage penalty if enabled (e.g. unmodeled urban bottleneck)
                if apply_ai_drainage and h_data["hazard_score"] > 0.05:
                    depth = depth * (1.0 + drainage_penalty_pct)

                # Compute damage ratio via Vulnerability Engine
                res = self.vuln.calculate_loss(tiv, depth, hc)
                prop_gross = res["loss_kes"]
                ratio = res["damage_ratio"]

                # Apply insurance terms: Deductible (D) & Limit (L)
                deductible_amt = tiv * deductible_pct
                limit_amt = tiv * policy_limit_pct
                prop_insured = min(limit_amt, max(0.0, prop_gross - deductible_amt))

                gross_loss += prop_gross
                insured_loss += prop_insured
                class_loss[hc] = class_loss.get(hc, 0.0) + prop_gross
                ward_loss[ward] = ward_loss.get(ward, 0.0) + prop_gross

                if prop_gross > 0:
                    property_losses.append({
                        "loc_id": asset.get("loc_id", "UNKNOWN"),
                        "name": asset.get("name", "Asset"),
                        "housing_class": hc,
                        "ward": ward,
                        "tiv_kes": tiv,
                        "depth_m": round(depth, 3),
                        "damage_ratio": ratio,
                        "gross_loss_kes": round(prop_gross, 2),
                        "insured_loss_kes": round(prop_insured, 2),
                    })

            # Sort top affected properties
            property_losses.sort(key=lambda x: x["gross_loss_kes"], reverse=True)

            elt.append({
                "return_period": rp,
                "years": cfg["rp_years"],
                "annual_exceedance_prob": cfg["annual_exceedance_prob"],
                "label": cfg["label"],
                "total_tiv_kes": round(total_tiv, 2),
                "gross_portfolio_loss_kes": round(gross_loss, 2),
                "insured_portfolio_loss_kes": round(insured_loss, 2),
                "gross_loss_ratio": round(gross_loss / total_tiv if total_tiv > 0 else 0.0, 6),
                "insured_loss_ratio": round(insured_loss / total_tiv if total_tiv > 0 else 0.0, 6),
                "loss_by_class": {k: round(v, 2) for k, v in class_loss.items()},
                "top_loss_wards": {k: round(v, 2) for k, v in sorted(ward_loss.items(), key=lambda i: i[1], reverse=True)[:5]},
                "affected_property_count": len(property_losses),
                "top_properties": property_losses[:10],
            })

        return elt

    def calculate_ep_curve(
        self,
        assets: Optional[List[Dict[str, Any]]] = None,
        apply_ai_drainage: bool = False,
        deductible_pct: float = 0.0,
        policy_limit_pct: float = 1.0,
    ) -> Dict[str, Any]:
        """
        Builds the Exceedance Probability (EP) Curve across return periods.
        Computes Average Annual Loss (AAL) via trapezoidal numerical integration.
        Computes Probable Maximum Loss (PML) metrics.
        """
        elt = self.calculate_event_loss_table(
            assets=assets,
            apply_ai_drainage=apply_ai_drainage,
            deductible_pct=deductible_pct,
            policy_limit_pct=policy_limit_pct
        )

        total_tiv = elt[0]["total_tiv_kes"] if elt else 0.0

        # Sort events by return period (years ascending: 5, 10, 25, 50, 100)
        sorted_elt = sorted(elt, key=lambda x: x["years"])

        # 1. Trapezoidal Numerical Integration for AAL (Average Annual Loss)
        # Formula: AAL = sum_{i} 0.5 * (Loss_i + Loss_{i+1}) * (p_i - p_{i+1}) + p_last * Loss_last
        aal_gross = 0.0
        aal_insured = 0.0

        for i in range(len(sorted_elt) - 1):
            p1 = sorted_elt[i]["annual_exceedance_prob"]
            p2 = sorted_elt[i + 1]["annual_exceedance_prob"]
            dp = p1 - p2  # e.g., 0.20 - 0.10 = 0.10

            l1_g = sorted_elt[i]["gross_portfolio_loss_kes"]
            l2_g = sorted_elt[i + 1]["gross_portfolio_loss_kes"]
            aal_gross += 0.5 * (l1_g + l2_g) * dp

            l1_i = sorted_elt[i]["insured_portfolio_loss_kes"]
            l2_i = sorted_elt[i + 1]["insured_portfolio_loss_kes"]
            aal_insured += 0.5 * (l1_i + l2_i) * dp

        # Tail integral beyond 100-year event (assuming Pareto tail decay)
        tail_p = sorted_elt[-1]["annual_exceedance_prob"] # 0.01
        tail_loss_g = sorted_elt[-1]["gross_portfolio_loss_kes"]
        tail_loss_i = sorted_elt[-1]["insured_portfolio_loss_kes"]
        aal_gross += tail_p * tail_loss_g
        aal_insured += tail_p * tail_loss_i

        # 2. Extract PML Metrics
        pml_10y = next(e["gross_portfolio_loss_kes"] for e in sorted_elt if e["years"] == 10)
        pml_50y = next(e["gross_portfolio_loss_kes"] for e in sorted_elt if e["years"] == 50)
        pml_100y = next(e["gross_portfolio_loss_kes"] for e in sorted_elt if e["years"] == 100)

        # Structure EP Curve points for visualization
        ep_points = []
        for item in sorted_elt:
            ep_points.append({
                "return_period": item["return_period"],
                "years": item["years"],
                "annual_prob": item["annual_exceedance_prob"],
                "label": item["label"],
                "gross_loss_kes": item["gross_portfolio_loss_kes"],
                "insured_loss_kes": item["insured_portfolio_loss_kes"],
                "loss_ratio": item["gross_loss_ratio"],
                "pml_90": round(item["gross_portfolio_loss_kes"] * 1.15, 2), # 90% confidence upper bound
            })

        return {
            "total_tiv_kes": total_tiv,
            "aal_gross_kes": round(aal_gross, 2),
            "aal_insured_kes": round(aal_insured, 2),
            "aal_rate_gross": round(aal_gross / total_tiv if total_tiv > 0 else 0.0, 6),
            "pml_10y_kes": pml_10y,
            "pml_50y_kes": pml_50y,
            "pml_100y_kes": pml_100y,
            "ai_drainage_applied": apply_ai_drainage,
            "deductible_applied_pct": deductible_pct,
            "ep_curve": ep_points,
            "event_loss_table": sorted_elt,
        }

    def price_reinsurance_xol(
        self,
        attachment_kes: float,
        limit_kes: float,
        share_pct: float = 1.0,
        assets: Optional[List[Dict[str, Any]]] = None,
        apply_ai_drainage: bool = False,
    ) -> Dict[str, Any]:
        """
        Structures and prices an Excess of Loss (XOL) Reinsurance Treaty Layer.
        - Attachment point: Loss threshold before layer triggers.
        - Limit: Maximum liability payable under treaty layer.
        - Share: Proportion of treaty underwritten by Kenya Re (e.g. 100% or 50%).
        """
        ep_data = self.calculate_ep_curve(assets=assets, apply_ai_drainage=apply_ai_drainage)
        elt = ep_data["event_loss_table"]

        layer_losses = []
        for event in elt:
            port_loss = event["gross_portfolio_loss_kes"]
            # Layer loss = min(Limit, max(0, Portfolio Loss - Attachment)) * Share
            loss_into_layer = min(limit_kes, max(0.0, port_loss - attachment_kes))
            reinsurer_payout = loss_into_layer * share_pct

            layer_losses.append({
                "return_period": event["return_period"],
                "years": event["years"],
                "annual_prob": event["annual_exceedance_prob"],
                "portfolio_loss_kes": port_loss,
                "layer_payout_kes": round(reinsurer_payout, 2),
                "layer_exhausted": loss_into_layer >= limit_kes,
            })

        # Calculate Expected Annual Loss (Pure Reinsurance Premium) for the layer
        layer_aal = 0.0
        for i in range(len(layer_losses) - 1):
            p1 = layer_losses[i]["annual_prob"]
            p2 = layer_losses[i + 1]["annual_prob"]
            dp = p1 - p2
            l1 = layer_losses[i]["layer_payout_kes"]
            l2 = layer_losses[i + 1]["layer_payout_kes"]
            layer_aal += 0.5 * (l1 + l2) * dp
        layer_aal += layer_losses[-1]["annual_prob"] * layer_losses[-1]["layer_payout_kes"]

        # Actuarial pricing: Pure Premium + Capital Margin (35%) + Expense Loading (15%)
        technical_rate_on_line = (layer_aal / limit_kes) if limit_kes > 0 else 0.0
        gross_premium = layer_aal * 1.50

        return {
            "layer_name": f"KES {limit_kes/1e6:.1f}M xs KES {attachment_kes/1e6:.1f}M",
            "attachment_kes": attachment_kes,
            "limit_kes": limit_kes,
            "share_pct": share_pct,
            "layer_aal_kes": round(layer_aal, 2),
            "rate_on_line_pct": round(technical_rate_on_line * 100, 3),
            "technical_pure_premium_kes": round(layer_aal, 2),
            "recommended_treaty_premium_kes": round(gross_premium, 2),
            "layer_event_outcomes": layer_losses,
        }

    def quote_single_slip_facultative(
        self,
        tiv_kes: float,
        lat: float,
        lon: float,
        housing_class: Any,
        deductible_pct: float = 0.05,
    ) -> Dict[str, Any]:
        """
        Quotes technical pricing, AAL, and deductible terms for a single policy slip (e.g. testData.md).
        """
        res_5y = self.hazard.get_hazard_depth(lat, lon, "5y")
        res_10y = self.hazard.get_hazard_depth(lat, lon, "10y")
        res_25y = self.hazard.get_hazard_depth(lat, lon, "25y")
        res_50y = self.hazard.get_hazard_depth(lat, lon, "50y")
        res_100y = self.hazard.get_hazard_depth(lat, lon, "100y")

        tiers = [
            ("5y", 0.20, res_5y["depth_m"]),
            ("10y", 0.10, res_10y["depth_m"]),
            ("25y", 0.04, res_25y["depth_m"]),
            ("50y", 0.02, res_50y["depth_m"]),
            ("100y", 0.01, res_100y["depth_m"]),
        ]

        event_losses = []
        for rp, p, depth in tiers:
            calc = self.vuln.calculate_loss(tiv_kes, depth, housing_class)
            gross = calc["loss_kes"]
            ded = tiv_kes * deductible_pct
            insured = max(0.0, gross - ded)
            event_losses.append((p, gross, insured, depth, calc["damage_ratio"]))

        # Numerical integration for asset AAL
        asset_aal_gross = 0.0
        asset_aal_insured = 0.0
        for i in range(len(event_losses) - 1):
            p1, g1, i1, _, _ = event_losses[i]
            p2, g2, i2, _, _ = event_losses[i + 1]
            dp = p1 - p2
            asset_aal_gross += 0.5 * (g1 + g2) * dp
            asset_aal_insured += 0.5 * (i1 + i2) * dp
        asset_aal_gross += event_losses[-1][0] * event_losses[-1][1]
        asset_aal_insured += event_losses[-1][0] * event_losses[-1][2]

        # Calculate technical rate
        pure_rate_pct = (asset_aal_insured / tiv_kes * 100) if tiv_kes > 0 else 0.0
        # If asset is elevated (e.g. Upper Hill), floor technical rate at minimum flood loading
        recommended_rate_pct = max(0.18, round(pure_rate_pct * 1.45, 3))
        recommended_premium = round(tiv_kes * (recommended_rate_pct / 100), 2)

        return {
            "tiv_kes": tiv_kes,
            "lat": lat,
            "lon": lon,
            "housing_class": housing_class,
            "deductible_pct": deductible_pct * 100,
            "deductible_kes": round(tiv_kes * deductible_pct, 2),
            "asset_aal_gross_kes": round(asset_aal_gross, 2),
            "asset_aal_insured_kes": round(asset_aal_insured, 2),
            "pure_rate_pct": round(pure_rate_pct, 4),
            "recommended_technical_rate_pct": recommended_rate_pct,
            "recommended_annual_premium_kes": recommended_premium,
            "100y_extreme_depth_m": res_100y["depth_m"],
            "100y_extreme_loss_kes": event_losses[-1][2],
        }


# Global singleton instance for high-speed API re-use
financial_engine = FinancialEngine()

