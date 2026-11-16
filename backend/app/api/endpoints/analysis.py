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

# Curated climatology fallbacks for preset sites to ensure demo robustness if live APIs fail
PRESET_FALLBACKS = {
    "atacama": {"temperature_min_c": 4.0, "temperature_max_c": 27.0, "temperature_mean_c": 15.5, "solar_irradiance_wm2": 260.0, "wind_speed_ms": 4.5, "precipitation_mm_day": 0.03, "elevation_m": 2400.0},
    "haughton": {"temperature_min_c": -31.0, "temperature_max_c": 6.0, "temperature_mean_c": -16.0, "solar_irradiance_wm2": 95.0, "wind_speed_ms": 4.0, "precipitation_mm_day": 0.35, "elevation_m": 170.0},
    "mauna_kea": {"temperature_min_c": -2.0, "temperature_max_c": 12.0, "temperature_mean_c": 4.0, "solar_irradiance_wm2": 240.0, "wind_speed_ms": 6.5, "precipitation_mm_day": 0.55, "elevation_m": 4207.0},
    "rio_tinto": {"temperature_min_c": 7.0, "temperature_max_c": 28.0, "temperature_mean_c": 17.5, "solar_irradiance_wm2": 210.0, "wind_speed_ms": 2.8, "precipitation_mm_day": 1.4, "elevation_m": 420.0},
    "volcanic_arc": {"temperature_min_c": 12.0, "temperature_max_c": 26.0, "temperature_mean_c": 19.0, "solar_irradiance_wm2": 210.0, "wind_speed_ms": 3.0, "precipitation_mm_day": 3.2, "elevation_m": 1500.0},
    "antarctica_dry_valleys": {"temperature_min_c": -45.0, "temperature_max_c": -5.0, "temperature_mean_c": -20.0, "solar_irradiance_wm2": 110.0, "wind_speed_ms": 5.5, "precipitation_mm_day": 0.05, "elevation_m": 750.0},
}


def _apply_preset_fallback(earth_data: dict, lat: float, lon: float) -> dict:
    preset = next((p for p in PRESET_FALLBACKS.items()
                   if abs(lat - {"atacama": -24.5, "haughton": 75.4, "mauna_kea": 19.82, "rio_tinto": 37.7, "volcanic_arc": 14.5, "antarctica_dry_valleys": -77.5}[p[0]]) < 0.05
                   and abs(lon - {"atacama": -69.2, "haughton": -89.7, "mauna_kea": -155.47, "rio_tinto": -6.55, "volcanic_arc": -90.9, "antarctica_dry_valleys": 160.9}[p[0]]) < 0.05), None)
    if not preset:
        return earth_data
    pid, fb = preset
    fields = ["temperature_min_c", "temperature_max_c", "temperature_mean_c", "solar_irradiance_wm2", "wind_speed_ms", "precipitation_mm_day", "elevation_m"]
    used = []
    for f in fields:
        if earth_data.get(f) is None and fb.get(f) is not None:
            earth_data[f] = fb[f]
            used.append(f)
    if used:
        dq = earth_data.get("data_quality") or {}
        dq["status"] = "fallback" if not dq.get("power_live") and not dq.get("elevation_live") else "partial_fallback"
        dq["label"] = f"Curated preset climatology fallback used for: {', '.join(used)}" if dq["status"] == "fallback" else f"Live data supplemented with preset fallback ({', '.join(used)})"
        dq["fallback_preset"] = pid
        dq["fallback_fields"] = used
        earth_data["data_quality"] = dq
        earth_data["source"] = earth_data.get("source", "") + " | Fallback: curated analog-site climatology reference"
    return earth_data


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

    # ?? Fetch Earth telemetry ?????????????????????????????????????????????????
    logger.info(
        f"Analysis request: lat={request.lat}, lon={request.lon}, "
        f"target={request.target_id}, hardware={request.hardware}"
    )
    try:
        earth_data = await fetch_earth_telemetry(request.lat, request.lon)
    except Exception as exc:
        logger.error(f"Telemetry fetch failed: {exc}")
        raise HTTPException(status_code=503, detail=f"Telemetry fetch error: {str(exc)}")

    earth_data = _apply_preset_fallback(earth_data, request.lat, request.lon)

    # ?? Run fidelity engine ???????????????????????????????????????????????????
    try:
        result = compute_fidelity(earth_data, target, request.hardware)
    except Exception as exc:
        logger.error(f"Fidelity engine error: {exc}")
        raise HTTPException(status_code=500, detail=f"Fidelity computation error: {str(exc)}")

    # ?? Build response ????????????????????????????????????????????????????????
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
        data_quality=earth_data.get("data_quality"),
    )

    data_sources = list(result["data_sources"])
    dq = earth_data.get("data_quality") or {}
    if dq.get("status") in ("fallback", "partial_fallback"):
        data_sources.append("ALTAIR curated preset climatology fallback (demo resilience when live APIs unavailable)")

    return FidelityReport(
        overall_fidelity_pct=result["overall_fidelity_pct"],
        hardware=result["hardware"],
        target_id=result["target_id"],
        target_name=result["target_name"],
        earth_telemetry=earth_telemetry,
        metric_comparisons=result["metric_comparisons"],
        risk_assessment=result["risk_assessment"],
        operational_summary=result["operational_summary"],
        data_sources=data_sources,
        methodology={
            "scoring": "Weighted multi-parameter similarity (temperature, solar irradiance, pressure, wind, precipitation/aridity, elevation) with hardware stress modifiers.",
            "earth_data": "Live NASA POWER climatology and Open-Elevation when available; curated preset fallback for resilience.",
            "planetary_reference": "Curated NASA mission reference parameters (LRO Diviner, Perseverance MEDA/CRISM, NASA PDS).",
            "interpretation": "Decision-support heuristic for analog screening; not flight-certified qualification.",
        },
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
