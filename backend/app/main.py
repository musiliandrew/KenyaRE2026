from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db, close_db
from app.api.routes import router as api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and extensions
    await init_db()
    yield
    # Shutdown: cleanly close pool
    await close_db()

app = FastAPI(
    title="Kenya Re · Catastrophe Risk Intelligence Platform API",
    description="Actuarial loss engine, JRC depth-damage functions, and AI exposure parser for Team A (Nairobi Urban Flood Challenge).",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware for Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(api_router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": "Welcome to Kenya Re Catastrophe Modeling API",
        "docs": "/docs",
        "organization": "Kenya Reinsurance Corporation",
        "challenge": "Team A - Nairobi Urban Surface-Water Flood"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)

