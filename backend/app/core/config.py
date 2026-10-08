from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Data paths
    DATA_DIR: str = "./data"
    NAIROBI_EXPOSURE_CSV: str = "./data/exposure_nairobi_synthetic.csv"
    NAIROBI_EXPOSURE_HAZARD_CSV: str = "./data/exposure_nairobi_with_hazard.csv"
    NAIROBI_HOTSPOTS_CSV: str = "./data/nairobi_hotspots_geocoded.csv"
    HAZARD_RASTERS_DIR: str = "./data/rasters"

    # AI Integration
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    MAPBOX_ACCESS_TOKEN: str = ""

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()

