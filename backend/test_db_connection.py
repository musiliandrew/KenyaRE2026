import asyncio
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv("c:/Users/musiliandrew/OneDrive/Desktop/KenyaRE/backend/.env")

async def test_full_cloud_db():
    user = os.getenv("PGUSER") or "neondb_owner"
    password = os.getenv("PGPASSWORD") or "npg_HwOmus64KLXh"
    database = os.getenv("PGDATABASE") or "neondb"
    host = os.getenv("PGHOST_UNPOOLED") or "ep-royal-credit-b8lrq8ii.c-14.us-east-1.aws.neon.tech"
    port = 5432

    print("==================================================================")
    print("      KENYA RE · NEON CLOUD POSTGRESQL CONNECTIVITY REPORT       ")
    print("==================================================================")
    print(f"Connecting to Host: {host} (SSL Required)...")
    
    try:
        conn = await asyncpg.connect(
            user=user,
            password=password,
            database=database,
            host=host,
            port=port,
            ssl="require"
        )
        print(">> Status: ONLINE & AUTHENTICATED SUCCESSFULLY")
        
        # 1. Server info
        ver = await conn.fetchval("SELECT version()")
        db_name = await conn.fetchval("SELECT current_database()")
        db_user = await conn.fetchval("SELECT current_user")
        print(f">> Database: {db_name}")
        print(f">> Connected User: {db_user}")
        print(f">> PostgreSQL Engine: {ver.split('on')[0].strip()}")
        
        # 2. Check extensions (PostGIS)
        exts = await conn.fetch("SELECT extname, extversion FROM pg_extension")
        ext_list = [f"{e['extname']} (v{e['extversion']})" for e in exts]
        print(f">> Installed Extensions: {', '.join(ext_list)}")
        
        # 3. Test PostGIS Spatial Calculation
        pt = await conn.fetchval("SELECT ST_AsText(ST_SetSRID(ST_MakePoint(36.8247, -1.2847), 4326))")
        postgis_ver = await conn.fetchval("SELECT PostGIS_Full_Version()")
        print(f">> PostGIS Spatial Geometry Engine: VERIFIED ACTIVE")
        print(f"   Sample Point (Landmark Plaza, Upper Hill): {pt}")
        print(f"   PostGIS Details: {postgis_ver.split(';')[0]}")
        
        # 4. Check existing tables
        tables = await conn.fetch("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        tbl_names = [t["table_name"] for t in tables]
        print(f">> Public Tables Count: {len(tbl_names)}")
        if tbl_names:
            print(f"   Tables: {', '.join(tbl_names)}")
        else:
            print("   Tables: Database is clean and ready for schema creation.")
            
        await conn.close()
        print("==================================================================")
        print("VERDICT: Cloud PostgreSQL + PostGIS is fully operational!")
        print("==================================================================")
        
    except Exception as e:
        print(f">> ERROR: Failed to connect to Neon DB: {e}")

if __name__ == "__main__":
    asyncio.run(test_full_cloud_db())
