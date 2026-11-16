"""
ALTAIR — NASA POWER API & Open-Elevation Integration Service
Fetches real-time / climatological Earth surface telemetry.

NASA POWER REST API (no key required):
  https://power.larc.nasa.gov/api/temporal/climatology/point

Open-Elevation API (no key required):
  https://api.open-elevation.com/api/v1/lookup
"""

import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ─── NASA POWER ───────────────────────────────────────────────────────────────
# Parameters we request from NASA POWER
# T2M      : Temperature at 2m (°C)
# T2M_MAX  : Max temperature at 2m (°C)
# T2M_MIN  : Min temperature at 2m (°C)
# ALLSKY_SFC_SW_DWN : All-sky surface shortwave downwelling irradiance (W/m²)
# WS10M    : Wind speed at 10m (m/s)
# PRECTOTCORR : Precipitation (mm/day)
NASA_POWER_PARAMS = "T2M,T2M_MAX,T2M_MIN,ALLSKY_SFC_SW_DWN,WS10M,PRECTOTCORR"
NASA_POWER_BASE = "https://power.larc.nasa.gov/api/temporal/climatology/point"
OPEN_ELEV_BASE  = "https://api.open-elevation.com/api/v1/lookup"

# ─── Timeout ─────────────────────────────────────────────────────────────────
REQUEST_TIMEOUT = 15.0  # seconds


async def fetch_earth_telemetry(lat: float, lon: float) -> dict:
    """
    Fetch Earth surface telemetry for the given coordinates.
    Returns a dict with keys:
        temperature_min_c, temperature_max_c, temperature_mean_c,
        solar_irradiance_wm2, wind_speed_ms, precipitation_mm_day,
        elevation_m, lat, lon, source, data_quality
    """
    temperature_min_c: Optional[float] = None
    temperature_max_c: Optional[float] = None
    temperature_mean_c: Optional[float] = None
    solar_irradiance_wm2: Optional[float] = None
    wind_speed_ms: Optional[float] = None
    precipitation_mm_day: Optional[float] = None
    elevation_m: Optional[float] = None
    power_live = False
    elev_live = False

    # ── NASA POWER ──────────────────────────────────────────────────────────
    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            resp = await client.get(
                NASA_POWER_BASE,
                params={
                    "parameters": NASA_POWER_PARAMS,
                    "community": "RE",
                    "longitude": lon,
                    "latitude": lat,
                    "format": "JSON",
                },
            )
            resp.raise_for_status()
            power_data = resp.json()

        props = power_data.get("properties", {}).get("parameter", {})

        def _annual_mean(param_key: str) -> Optional[float]:
            """Extract the ANN (annual mean) value from POWER climatology response."""
            series = props.get(param_key, {})
            ann = series.get("ANN")
            if ann is not None and ann != -999.0:
                return round(float(ann), 2)
            monthly = [v for k, v in series.items() if k != "ANN" and v != -999.0]
            return round(sum(monthly) / len(monthly), 2) if monthly else None

        temperature_mean_c = _annual_mean("T2M")
        temperature_max_c  = _annual_mean("T2M_MAX")
        temperature_min_c  = _annual_mean("T2M_MIN")
        solar_irradiance_wm2 = _annual_mean("ALLSKY_SFC_SW_DWN")
        wind_speed_ms = _annual_mean("WS10M")
        precipitation_mm_day = _annual_mean("PRECTOTCORR")
        power_live = any(v is not None for v in [temperature_mean_c, solar_irradiance_wm2, wind_speed_ms, precipitation_mm_day])

        logger.info(f"NASA POWER: lat={lat}, lon={lon} → T2M={temperature_mean_c}°C")

    except Exception as exc:
        logger.warning(f"NASA POWER fetch failed for ({lat}, {lon}): {exc}")

    # ── Open-Elevation ───────────────────────────────────────────────────────
    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            resp = await client.get(
                OPEN_ELEV_BASE,
                params={"locations": f"{lat},{lon}"},
            )
            resp.raise_for_status()
            elev_data = resp.json()

        results = elev_data.get("results", [])
        if results:
            raw_elev = results[0].get("elevation")
            if raw_elev is not None:
                elevation_m = round(float(raw_elev), 1)
                elev_live = True

        logger.info(f"Open-Elevation: lat={lat}, lon={lon} → {elevation_m}m")

    except Exception as exc:
        logger.warning(f"Open-Elevation fetch failed for ({lat}, {lon}): {exc}")

    missing = [k for k, v in {
        "temperature": temperature_mean_c,
        "solar": solar_irradiance_wm2,
        "wind": wind_speed_ms,
        "precipitation": precipitation_mm_day,
        "elevation": elevation_m,
    }.items() if v is None]
    if power_live and elev_live and not missing:
        dq_status, dq_label = "live", "Live NASA POWER + Open-Elevation"
    elif power_live or elev_live:
        dq_status, dq_label = "partial", "Partial live data (some fields unavailable)"
    else:
        dq_status, dq_label = "unavailable", "Live sources unavailable"

    return {
        "temperature_min_c": temperature_min_c,
        "temperature_max_c": temperature_max_c,
        "temperature_mean_c": temperature_mean_c,
        "solar_irradiance_wm2": solar_irradiance_wm2,
        "wind_speed_ms": wind_speed_ms,
        "precipitation_mm_day": precipitation_mm_day,
        "elevation_m": elevation_m,
        "lat": lat,
        "lon": lon,
        "source": "NASA POWER Climatology API v2.5 + Open-Elevation API",
        "data_quality": {
            "status": dq_status,
            "label": dq_label,
            "power_live": power_live,
            "elevation_live": elev_live,
            "missing_fields": missing,
        },
    }
