"""
ALTAIR — /api/v1/analysis endpoints
Core analysis pipeline: Earth telemetry fetch → Fidelity Engine → Response.
"""

import json
import logging
from pathlib import Path
from fastapi import APIRouter, HTTPException

from app.schemas.models import AnalysisRequest, FidelityReport, EarthTelemetry
from app.services.telemetry_service import fetch_earth_telemetry
from app.services.fidelity_engine import compute_fidelity

router = APIRouter()
logger = logging.getLogger(__name__)

DATA_PATH = Path(__file__).parent.parent.parent.parent / "data" / "planetary_targets.json"
VALID_HARDWARE = {"Rover", "EVA Suit", "Habitat"}


def _load_targets():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@router.post(
    "/",
    response_model=FidelityReport,
    summary="Run full analog fidelity analysis for Earth coordinates",
)
async def run_analysis(request: AnalysisRequest):
    """
    **Core ALTAIR Pipeline:**

    1. Validates the requested planetary target ID.
    2. Fetches live/climatological Earth telemetry from NASA POWER API
       (temperature, solar irradiance, wind, precipitation) and elevation
       from Open-Elevation API.
    3. Runs the weighted fidelity calculation engine comparing Earth parameters
       against the NASA LRO/PDS planetary reference dataset.
    4. Returns a structured `FidelityReport` with per-metric scores,
       an Operational Risk Assessment, and an executive summary.
    """
    # ── Validate hardware ────────────────────────────────────────────────────
    if request.hardware not in VALID_HARDWARE:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid hardware '{request.hardware}'. Must be one of: {VALID_HARDWARE}",
        )

    # ── Load & validate target ───────────────────────────────────────────────
    targets = _load_targets()
    target = next((t for t in targets if t["id"] == request.target_id), None)
    if not target:
        raise HTTPException(
            status_code=404,
            detail=f"Planetary target '{request.target_id}' not found.",
        )

    # ── Fetch Earth telemetry ────────────────────────────────────────────────
    logger.info(
        f"Analysis request: lat={request.lat}, lon={request.lon}, "
        f"target={request.target_id}, hardware={request.hardware}"
    )
    try:
        earth_data = await fetch_earth_telemetry(request.lat, request.lon)
    except Exception as exc:
        logger.error(f"Telemetry fetch failed: {exc}")
        raise HTTPException(status_code=503, detail=f"Telemetry fetch error: {str(exc)}")

    # ── Run fidelity engine ──────────────────────────────────────────────────
    try:
        result = compute_fidelity(earth_data, target, request.hardware)
    except Exception as exc:
        logger.error(f"Fidelity engine error: {exc}")
        raise HTTPException(status_code=500, detail=f"Fidelity computation error: {str(exc)}")

    # ── Build response ───────────────────────────────────────────────────────
    earth_telemetry = EarthTelemetry(
        temperature_min_c=earth_data.get("temperature_min_c"),
        temperature_max_c=earth_data.get("temperature_max_c"),
        temperature_mean_c=earth_data.get("temperature_mean_c"),
        solar_irradiance_wm2=earth_data.get("solar_irradiance_wm2"),
        wind_speed_ms=earth_data.get("wind_speed_ms"),
        precipitation_mm_day=earth_data.get("precipitation_mm_day"),
        elevation_m=earth_data.get("elevation_m"),
        source=earth_data.get("source", "NASA POWER API"),
        lat=request.lat,
        lon=request.lon,
    )

    return FidelityReport(
        overall_fidelity_pct=result["overall_fidelity_pct"],
        hardware=result["hardware"],
        target_id=result["target_id"],
        target_name=result["target_name"],
        earth_telemetry=earth_telemetry,
        metric_comparisons=result["metric_comparisons"],
        risk_assessment=result["risk_assessment"],
        operational_summary=result["operational_summary"],
        data_sources=result["data_sources"],
    )


@router.get(
    "/presets",
    summary="List preset Earth analog locations",
)
async def list_presets():
    """Returns the curated list of scientifically verified Earth analog sites."""
    return [
        {
            "id": "atacama",
            "name": "Atacama Desert",
            "country": "Chile",
            "lat": -24.5,
            "lon": -69.2,
            "description": "World's driest non-polar desert. Extreme UV, arid regolith analog. Mars/Moon aridity analog.",
            "analog_type": ["Lunar South Pole", "Mars"],
            "thumbnail_key": "atacama",
        },
        {
            "id": "haughton",
            "name": "Haughton Crater",
            "country": "Canada (Devon Island)",
            "lat": 75.4,
            "lon": -89.7,
            "description": "Arctic impact crater. Cold, dry, isolated geology. NASA HMP primary analog site.",
            "analog_type": ["Lunar South Pole", "Mars"],
            "thumbnail_key": "haughton",
        },
        {
            "id": "mauna_kea",
            "name": "Mauna Kea Summit",
            "country": "USA (Hawaii)",
            "lat": 19.82,
            "lon": -155.47,
            "description": "High-altitude (4,207m), low-pressure, low-humidity volcanic terrain. Mars pressure analog.",
            "analog_type": ["Mars"],
            "thumbnail_key": "mauna_kea",
        },
        {
            "id": "rio_tinto",
            "name": "Río Tinto",
            "country": "Spain",
            "lat": 37.7,
            "lon": -6.55,
            "description": "Iron-rich acidic river system. Mars iron-oxide mineralogy analog. Extremophile habitability.",
            "analog_type": ["Mars"],
            "thumbnail_key": "rio_tinto",
        },
        {
            "id": "volcanic_arc",
            "name": "Central America Volcanic Arc",
            "country": "Guatemala/Costa Rica",
            "lat": 14.5,
            "lon": -90.9,
            "description": "Active volcanic terrain. Regolith analog for basaltic surfaces. Extreme terrain operations.",
            "analog_type": ["Lunar South Pole", "Mars"],
            "thumbnail_key": "volcanic_arc",
        },
        {
            "id": "antarctica_dry_valleys",
            "name": "Antarctic Dry Valleys",
            "country": "Antarctica",
            "lat": -77.5,
            "lon": 160.9,
            "description": "Coldest and driest places on Earth. Permafrost analog for lunar PSR ice deposits.",
            "analog_type": ["Lunar South Pole"],
            "thumbnail_key": "antarctica",
        },
    ]
