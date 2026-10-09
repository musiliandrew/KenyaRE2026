"""
Kenya Re Catastrophe Risk Intelligence Platform · Database Engine
==================================================================
Manages high-performance asynchronous connection pooling to Neon Cloud
PostgreSQL with PostGIS spatial extensions using asyncpg.
"""

import os
import logging
from typing import Optional
import asyncpg
from app.core.config import settings

logger = logging.getLogger("kenya_re.db")

_pool: Optional[asyncpg.Pool] = None

SCHEMA_SQL = """
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS portfolios (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255),
    source VARCHAR(64) NOT NULL DEFAULT 'file_upload',
    asset_count INT NOT NULL DEFAULT 0,
    total_tiv_kes DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    active_rp VARCHAR(16) DEFAULT '100y',
    summary_json JSONB,
    ep_data_json JSONB,
    last_run_result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exposure_assets (
    id VARCHAR(128) PRIMARY KEY,
    portfolio_id VARCHAR(64) REFERENCES portfolios(id) ON DELETE CASCADE,
    loc_id VARCHAR(64) NOT NULL,
    name VARCHAR(255),
    ward VARCHAR(128),
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    geom geometry(Point, 4326),
    housing_class VARCHAR(64),
    floor_area_m2 DOUBLE PRECISION DEFAULT 1000.0,
    cost_per_m2_kes DOUBLE PRECISION DEFAULT 15000.0,
    tiv_kes DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    depth_m DOUBLE PRECISION DEFAULT 0.0,
    damage_ratio DOUBLE PRECISION DEFAULT 0.0,
    loss_kes DOUBLE PRECISION DEFAULT 0.0,
    risk_level VARCHAR(32) DEFAULT 'low',
    source_file VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exposure_assets_portfolio_id ON exposure_assets(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_exposure_assets_geom ON exposure_assets USING GIST(geom);

CREATE TABLE IF NOT EXISTS treaty_quotes (
    id VARCHAR(64) PRIMARY KEY,
    portfolio_id VARCHAR(64),
    cedant_name VARCHAR(255),
    attachment_kes DOUBLE PRECISION,
    limit_kes DOUBLE PRECISION,
    layer_type VARCHAR(64),
    expected_loss_kes DOUBLE PRECISION,
    technical_rate_pct DOUBLE PRECISION,
    commercial_premium_kes DOUBLE PRECISION,
    roi_pct DOUBLE PRECISION,
    details_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS simulation_runs (
    id VARCHAR(64) PRIMARY KEY,
    portfolio_id VARCHAR(64),
    scenario_rp VARCHAR(16),
    event_loss_kes DOUBLE PRECISION,
    aal_kes DOUBLE PRECISION,
    pml_100y_kes DOUBLE PRECISION,
    results_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""

def get_connection_kwargs() -> dict:
    user = settings.PGUSER or os.getenv("PGUSER") or "neondb_owner"
    password = settings.PGPASSWORD or os.getenv("PGPASSWORD") or "npg_HwOmus64KLXh"
    database = settings.PGDATABASE or os.getenv("PGDATABASE") or "neondb"
    host = (
        settings.PGHOST_UNPOOLED
        or os.getenv("PGHOST_UNPOOLED")
        or settings.PGHOST
        or os.getenv("PGHOST")
        or "ep-royal-credit-b8lrq8ii.c-14.us-east-1.aws.neon.tech"
    )
    return {
        "user": user,
        "password": password,
        "database": database,
        "host": host,
        "port": 5432,
        "ssl": "require",
        "min_size": 1,
        "max_size": 10,
        "command_timeout": 30.0,
    }

async def get_db_pool() -> Optional[asyncpg.Pool]:
    global _pool
    if _pool is not None:
        return _pool
    try:
        kwargs = get_connection_kwargs()
        _pool = await asyncpg.create_pool(**kwargs)
        logger.info("Successfully connected to Neon PostgreSQL connection pool.")
        return _pool
    except Exception as e:
        logger.warning(f"Could not connect to Neon PostgreSQL pool: {e}")
        return None

async def init_db():
    """Initializes tables and PostGIS spatial extensions."""
    pool = await get_db_pool()
    if pool is None:
        logger.warning("Database pool is offline; skipping database schema initialization.")
        return False
    try:
        async with pool.acquire() as conn:
            await conn.execute(SCHEMA_SQL)
        logger.info("Neon PostgreSQL schema and PostGIS tables initialized successfully.")
        return True
    except Exception as e:
        logger.error(f"Error initializing DB schema: {e}")
        return False

async def close_db():
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
        logger.info("Neon PostgreSQL pool closed.")

