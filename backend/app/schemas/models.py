"""
ALTAIR — Pydantic schemas for API request/response validation
"""

from pydantic import BaseModel, Field
from typing import Optional


# ─── Request Models ───────────────────────────────────────────────────────────

class AnalysisRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90, description="Latitude of Earth analog site")
    lon: float = Field(..., ge=-180, le=180, description="Longitude of Earth analog site")
    target_id: str = Field(
        ...,
        description="Planetary target ID (e.g., 'lunar_south_pole', 'jezero_crater_mars')",
    )
    hardware: str = Field(
        "Rover",
        description="Mission hardware type: Rover | EVA Suit | Habitat",
    )


# ─── Response Models ──────────────────────────────────────────────────────────

class EarthTelemetry(BaseModel):
    temperature_min_c: Optional[float]
    temperature_max_c: Optional[float]
    temperature_mean_c: Optional[float]
    solar_irradiance_wm2: Optional[float]
    wind_speed_ms: Optional[float]
    precipitation_mm_day: Optional[float]
    elevation_m: Optional[float]
    source: str = "NASA POWER API + Open-Elevation API"
    lat: float
    lon: float


class MetricComparison(BaseModel):
    metric: str
    unit: str
    earth_value: Optional[float]
    target_value: Optional[float]
    deviation_pct: Optional[float]
    weight: float
    score: float  # 0–100 contribution


class RiskItem(BaseModel):
    system: str
    level: str  # "LOW" | "MODERATE" | "HIGH" | "CRITICAL"
    detail: str


class FidelityReport(BaseModel):
    overall_fidelity_pct: float
    hardware: str
    target_id: str
    target_name: str
    earth_telemetry: EarthTelemetry
    metric_comparisons: list[MetricComparison]
    risk_assessment: list[RiskItem]
    operational_summary: str
    data_sources: list[str]
