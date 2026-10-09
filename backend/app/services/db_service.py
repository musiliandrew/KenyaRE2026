"""
Kenya Re Catastrophe Risk Intelligence Platform · Database Service
===================================================================
Provides asynchronous CRUD and spatial operations for portfolios,
exposure assets, treaty quotes, and simulation runs stored in Neon PostgreSQL.
"""

import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.core.database import get_db_pool

logger = logging.getLogger("kenya_re.db_service")

class DatabaseService:
    """Service handling all persistent PostgreSQL + PostGIS operations."""

    async def get_stats(self) -> Dict[str, Any]:
        """Returns database health and aggregate record counts."""
        pool = await get_db_pool()
        if pool is None:
            return {"status": "offline", "database": "none", "portfolios_count": 0, "assets_count": 0}
        
        try:
            async with pool.acquire() as conn:
                p_count = await conn.fetchval("SELECT COUNT(*) FROM portfolios;")
                a_count = await conn.fetchval("SELECT COUNT(*) FROM exposure_assets;")
                q_count = await conn.fetchval("SELECT COUNT(*) FROM treaty_quotes;")
                pg_ver = await conn.fetchval("SELECT version();")
                postgis_ver = await conn.fetchval("SELECT PostGIS_Full_Version();")
                return {
                    "status": "online",
                    "database": "Neon Cloud PostgreSQL 18 + PostGIS",
                    "portfolios_count": int(p_count),
                    "assets_count": int(a_count),
                    "quotes_count": int(q_count),
                    "engine": pg_ver.split("on")[0].strip() if pg_ver else "PostgreSQL",
                    "postgis": postgis_ver.split(";")[0] if postgis_ver else "Active",
                }
        except Exception as e:
            logger.error(f"Failed to fetch DB stats: {e}")
            return {"status": "error", "error": str(e), "portfolios_count": 0, "assets_count": 0}

    async def list_portfolios(self) -> List[Dict[str, Any]]:
        """Lists all stored portfolios ordered by most recently updated."""
        pool = await get_db_pool()
        if pool is None:
            return []

        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch("""
                    SELECT 
                        id, name, file_name, source, asset_count, total_tiv_kes, active_rp,
                        summary_json, ep_data_json, last_run_result,
                        created_at, updated_at
                    FROM portfolios
                    ORDER BY updated_at DESC;
                """)
                portfolios = []
                for r in rows:
                    summary = json.loads(r["summary_json"]) if r["summary_json"] else {}
                    ep_data = json.loads(r["ep_data_json"]) if r["ep_data_json"] else {}
                    last_run = json.loads(r["last_run_result"]) if r["last_run_result"] else None
                    portfolios.append({
                        "id": r["id"],
                        "name": r["name"],
                        "fileName": r["file_name"],
                        "source": r["source"],
                        "assetCount": r["asset_count"],
                        "totalTivKes": r["total_tiv_kes"],
                        "activeRp": r["active_rp"],
                        "timestamp": r["created_at"].isoformat() if r["created_at"] else datetime.utcnow().isoformat(),
                        "updatedAt": r["updated_at"].isoformat() if r["updated_at"] else datetime.utcnow().isoformat(),
                        "summary": summary,
                        "epData": ep_data,
                        "lastRunResult": last_run,
                    })
                return portfolios
        except Exception as e:
            logger.error(f"Error listing portfolios: {e}")
            return []

    async def get_portfolio(self, portfolio_id: str) -> Optional[Dict[str, Any]]:
        """Fetches full portfolio dossier including all geocoded exposure assets."""
        pool = await get_db_pool()
        if pool is None:
            return None

        try:
            async with pool.acquire() as conn:
                p_row = await conn.fetchrow("""
                    SELECT 
                        id, name, file_name, source, asset_count, total_tiv_kes, active_rp,
                        summary_json, ep_data_json, last_run_result,
                        created_at, updated_at
                    FROM portfolios
                    WHERE id = $1;
                """, portfolio_id)

                if not p_row:
                    return None

                summary = json.loads(p_row["summary_json"]) if p_row["summary_json"] else {}
                ep_data = json.loads(p_row["ep_data_json"]) if p_row["ep_data_json"] else {}
                last_run = json.loads(p_row["last_run_result"]) if p_row["last_run_result"] else None

                asset_rows = await conn.fetch("""
                    SELECT 
                        id, loc_id, name, ward, lat, lon, housing_class,
                        floor_area_m2, cost_per_m2_kes, tiv_kes,
                        depth_m, damage_ratio, loss_kes, risk_level, source_file
                    FROM exposure_assets
                    WHERE portfolio_id = $1
                    ORDER BY loc_id ASC;
                """, portfolio_id)

                assets = []
                for a in asset_rows:
                    assets.append({
                        "id": a["id"],
                        "loc_id": a["loc_id"],
                        "name": a["name"] or a["loc_id"],
                        "ward": a["ward"] or "Nairobi",
                        "lat": float(a["lat"]),
                        "lng": float(a["lon"]),
                        "lon": float(a["lon"]),
                        "housing_class": a["housing_class"],
                        "area_sqm": float(a["floor_area_m2"]),
                        "floor_area_m2": float(a["floor_area_m2"]),
                        "cost_per_m2_kes": float(a["cost_per_m2_kes"]),
                        "tiv_kes": float(a["tiv_kes"]),
                        "depth_m": float(a["depth_m"] or 0.0),
                        "damage_ratio": float(a["damage_ratio"] or 0.0),
                        "loss_kes": float(a["loss_kes"] or 0.0),
                        "risk_level": a["risk_level"] or "low",
                        "source_file": a["source_file"],
                    })

                return {
                    "id": p_row["id"],
                    "name": p_row["name"],
                    "fileName": p_row["file_name"],
                    "source": p_row["source"],
                    "assetCount": p_row["asset_count"],
                    "totalTivKes": p_row["total_tiv_kes"],
                    "timestamp": p_row["created_at"].isoformat() if p_row["created_at"] else datetime.utcnow().isoformat(),
                    "updatedAt": p_row["updated_at"].isoformat() if p_row["updated_at"] else datetime.utcnow().isoformat(),
                    "assets": assets,
                    "summary": summary,
                    "epData": ep_data,
                    "lastRunResult": last_run,
                }
        except Exception as e:
            logger.error(f"Error fetching portfolio {portfolio_id}: {e}")
            return None

    async def save_portfolio(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Saves or updates a complete portfolio along with all its exposure assets.
        Inserts PostGIS Point geometry (SRID 4326) for each asset coordinate.
        """
        pool = await get_db_pool()
        if pool is None:
            raise RuntimeError("Database connection pool is offline.")

        p_id = str(data.get("id") or f"run-{int(datetime.utcnow().timestamp())}")
        name = str(data.get("name") or "Custom Exposure Portfolio")
        file_name = data.get("fileName")
        source = str(data.get("source") or "file_upload")
        raw_assets = data.get("assets") or []
        asset_count = int(data.get("assetCount") or len(raw_assets))
        total_tiv = float(data.get("totalTivKes") or sum(a.get("tiv_kes", 0.0) for a in raw_assets))
        active_rp = str(data.get("activeRp") or "100y")

        summary_json = json.dumps(data.get("summary") or {})
        ep_data_json = json.dumps(data.get("epData") or {})
        last_run_json = json.dumps(data.get("lastRunResult")) if data.get("lastRunResult") is not None else None

        async with pool.acquire() as conn:
            async with conn.transaction():
                # 1. Upsert Portfolio Record
                await conn.execute("""
                    INSERT INTO portfolios (
                        id, name, file_name, source, asset_count, total_tiv_kes, active_rp,
                        summary_json, ep_data_json, last_run_result, created_at, updated_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7,
                        $8::jsonb, $9::jsonb, $10::jsonb, NOW(), NOW()
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        file_name = EXCLUDED.file_name,
                        source = EXCLUDED.source,
                        asset_count = EXCLUDED.asset_count,
                        total_tiv_kes = EXCLUDED.total_tiv_kes,
                        active_rp = EXCLUDED.active_rp,
                        summary_json = EXCLUDED.summary_json,
                        ep_data_json = EXCLUDED.ep_data_json,
                        last_run_result = EXCLUDED.last_run_result,
                        updated_at = NOW();
                """, p_id, name, file_name, source, asset_count, total_tiv, active_rp, summary_json, ep_data_json, last_run_json)

                # 2. Clear old assets for this portfolio (if updating)
                await conn.execute("DELETE FROM exposure_assets WHERE portfolio_id = $1;", p_id)

                # 3. Bulk insert assets with PostGIS Point geometries
                if raw_assets:
                    asset_records = []
                    for idx, a in enumerate(raw_assets):
                        loc_id = str(a.get("loc_id") or a.get("id") or f"LOC-{idx:04d}").strip()
                        asset_pk = f"{p_id}_{loc_id}_{idx}"
                        a_name = str(a.get("name") or loc_id)
                        ward = str(a.get("ward") or "Nairobi")
                        lat = float(a.get("lat") or -1.2847)
                        lon = float(a.get("lng") if a.get("lng") is not None else (a.get("lon") or 36.8247))
                        h_class = str(a.get("housing_class") or "concrete_rcc")
                        area = float(a.get("area_sqm") or a.get("floor_area_m2") or 1000.0)
                        cost_sqm = float(a.get("cost_per_m2_kes") or 15000.0)
                        tiv = float(a.get("tiv_kes") or (area * cost_sqm))
                        depth = float(a.get("depth_m") or 0.0)
                        damage = float(a.get("damage_ratio") or 0.0)
                        loss = float(a.get("loss_kes") or (tiv * damage))
                        risk = str(a.get("risk_level") or "low")
                        s_file = a.get("source_file") or file_name

                        asset_records.append((
                            asset_pk, p_id, loc_id, a_name, ward, lat, lon,
                            h_class, area, cost_sqm, tiv, depth, damage, loss, risk, s_file
                        ))

                    await conn.executemany("""
                        INSERT INTO exposure_assets (
                            id, portfolio_id, loc_id, name, ward, lat, lon,
                            geom, housing_class, floor_area_m2, cost_per_m2_kes,
                            tiv_kes, depth_m, damage_ratio, loss_kes, risk_level, source_file, created_at
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7,
                            ST_SetSRID(ST_MakePoint($7, $6), 4326),
                            $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW()
                        );
                    """, asset_records)

        logger.info(f"Successfully saved portfolio '{p_id}' ({name}) with {len(raw_assets)} assets to Neon PostgreSQL.")
        return {
            "id": p_id,
            "name": name,
            "asset_count": asset_count,
            "total_tiv_kes": total_tiv,
            "status": "saved"
        }

    async def rename_portfolio(self, portfolio_id: str, new_name: str) -> bool:
        """Renames an existing portfolio record."""
        pool = await get_db_pool()
        if pool is None:
            return False
        try:
            async with pool.acquire() as conn:
                res = await conn.execute("""
                    UPDATE portfolios
                    SET name = $2, updated_at = NOW()
                    WHERE id = $1;
                """, portfolio_id, new_name.strip())
                return "UPDATE 1" in res
        except Exception as e:
            logger.error(f"Error renaming portfolio {portfolio_id}: {e}")
            return False

    async def delete_portfolio(self, portfolio_id: str) -> bool:
        """Deletes a portfolio and all linked assets via cascade."""
        pool = await get_db_pool()
        if pool is None:
            return False
        try:
            async with pool.acquire() as conn:
                res = await conn.execute("DELETE FROM portfolios WHERE id = $1;", portfolio_id)
                return "DELETE 1" in res
        except Exception as e:
            logger.error(f"Error deleting portfolio {portfolio_id}: {e}")
            return False

    async def save_treaty_quote(self, quote: Dict[str, Any]) -> Dict[str, Any]:
        """Saves an underwriter treaty pricing quote."""
        pool = await get_db_pool()
        if pool is None:
            return quote
        try:
            q_id = str(quote.get("id") or f"quote-{int(datetime.utcnow().timestamp())}")
            p_id = quote.get("portfolio_id")
            cedant = str(quote.get("cedant_name") or "Primary Cedant")
            att = float(quote.get("attachment_kes") or 0.0)
            lim = float(quote.get("limit_kes") or 0.0)
            l_type = str(quote.get("layer_type") or "Excess of Loss")
            exp_loss = float(quote.get("expected_loss_kes") or 0.0)
            tech_rate = float(quote.get("technical_rate_pct") or 0.0)
            comm_prem = float(quote.get("commercial_premium_kes") or 0.0)
            roi = float(quote.get("roi_pct") or 0.0)
            details = json.dumps(quote.get("details") or quote)

            async with pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO treaty_quotes (
                        id, portfolio_id, cedant_name, attachment_kes, limit_kes,
                        layer_type, expected_loss_kes, technical_rate_pct,
                        commercial_premium_kes, roi_pct, details_json, created_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, NOW()
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        commercial_premium_kes = EXCLUDED.commercial_premium_kes,
                        details_json = EXCLUDED.details_json;
                """, q_id, p_id, cedant, att, lim, l_type, exp_loss, tech_rate, comm_prem, roi, details)

            return {"id": q_id, "status": "saved"}
        except Exception as e:
            logger.error(f"Error saving treaty quote: {e}")
            return quote

    async def list_treaty_quotes(self) -> List[Dict[str, Any]]:
        """Lists saved treaty pricing quotes."""
        pool = await get_db_pool()
        if pool is None:
            return []
        try:
            async with pool.acquire() as conn:
                rows = await conn.fetch("SELECT * FROM treaty_quotes ORDER BY created_at DESC LIMIT 50;")
                return [dict(r) for r in rows]
        except Exception as e:
            logger.error(f"Error listing quotes: {e}")
            return []


# Singleton database service
db_service = DatabaseService()

