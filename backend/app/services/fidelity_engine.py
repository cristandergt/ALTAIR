"""
ALTAIR — Fidelity Calculation Engine
Computes a weighted analog fidelity score (0–100%) comparing
real Earth telemetry against NASA LRO/PDS planetary targets,
modulated by mission hardware, and generates a structured
Operational Risk Assessment.

Scientific Basis:
- Temperature similarity: exponential decay on delta
- Solar irradiance: ratio-based comparison (log scale for extremes)
- Atmospheric pressure: log-ratio for orders-of-magnitude differences
- Wind speed: normalized deviation
- Precipitation/Aridity: binary + magnitude for arid targets
- Elevation: normalized range comparison
"""

import math
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ─── Metric Weight Table ──────────────────────────────────────────────────────
# Weights must sum to 1.0
METRIC_WEIGHTS = {
    "temperature":    0.35,  # Dominant analog factor
    "solar":          0.20,  # Critical for power system analogy
    "pressure":       0.20,  # Key for suit/habitat pressurization analogy
    "wind":           0.10,  # Dust storm / structural load analogy
    "precipitation":  0.10,  # Aridity / ISRU water analogy
    "elevation":      0.05,  # Terrain / atmospheric column analogy
}


def _safe(val: Optional[float], default: float = 0.0) -> float:
    return default if val is None else val


def _temperature_score(earth_mean: float, target_mean: float, target_min: float, target_max: float) -> float:
    """
    Score based on how close Earth mean temperature is to the target's
    operating envelope [min, max]. Full score if within range, exponential
    decay for deviation outside range.
    """
    span = max(abs(target_max - target_min), 1.0)
    if target_min <= earth_mean <= target_max:
        return 100.0
    dist = min(abs(earth_mean - target_min), abs(earth_mean - target_max))
    # Decay constant k chosen so ~100°C offset → ~10% score
    k = 0.023
    score = 100.0 * math.exp(-k * dist)
    return max(0.0, min(100.0, score))


def _solar_score(earth_wm2: float, target_wm2: float) -> float:
    """
    Log-ratio comparison. Perfect if equal; decays for large ratios.
    Special case: target=0 (PSR) scores high only if Earth value is very low.
    """
    if target_wm2 == 0:
        # Polar winter / PSR — reward low irradiance sites
        if earth_wm2 <= 50:
            return 90.0
        elif earth_wm2 <= 200:
            return 50.0
        else:
            return max(0.0, 100.0 - (earth_wm2 / 10.0))

    ratio = earth_wm2 / target_wm2 if target_wm2 > 0 else 1.0
    log_ratio = abs(math.log(max(ratio, 0.01)))
    return max(0.0, min(100.0, 100.0 * math.exp(-0.8 * log_ratio)))


def _pressure_score(earth_atm: float, target_atm: float) -> float:
    """
    Log-ratio comparison. Earth at sea level = 1 atm.
    Mars = 0.006 atm, Moon = 0 atm.
    """
    if target_atm == 0:
        # Vacuum target — high-altitude / low-pressure Earth sites score higher
        if earth_atm <= 0.5:
            return 60.0
        elif earth_atm <= 0.7:
            return 30.0
        return max(0.0, 15.0 - (earth_atm * 10))

    earth_atm_safe = max(earth_atm, 0.001)
    target_atm_safe = max(target_atm, 0.001)
    log_ratio = abs(math.log(earth_atm_safe / target_atm_safe))
    return max(0.0, min(100.0, 100.0 * math.exp(-0.5 * log_ratio)))


def _wind_score(earth_ms: float, target_ms: float) -> float:
    """Normalized deviation. Within 50% → high score."""
    if target_ms == 0 and earth_ms == 0:
        return 100.0
    max_v = max(target_ms, earth_ms, 1.0)
    dev = abs(earth_ms - target_ms) / max_v
    return max(0.0, min(100.0, 100.0 * math.exp(-2.0 * dev)))


def _precipitation_score(earth_mm: float, target_mm: float) -> float:
    """For arid targets (0 mm/day), reward very dry Earth sites."""
    if target_mm == 0:
        if earth_mm <= 0.1:
            return 95.0
        elif earth_mm <= 1.0:
            return 70.0
        elif earth_mm <= 5.0:
            return 40.0
        return max(0.0, 100.0 - (earth_mm * 5))
    # Non-zero target
    max_p = max(target_mm, earth_mm, 0.01)
    dev = abs(earth_mm - target_mm) / max_p
    return max(0.0, min(100.0, 100.0 * math.exp(-1.5 * dev)))


def _elevation_score(earth_m: float, target_m: float) -> float:
    """Normalized elevation proximity. ±5000m considered a wide analog."""
    diff = abs(earth_m - target_m)
    return max(0.0, min(100.0, 100.0 * math.exp(-diff / 4000.0)))


def compute_fidelity(
    earth_telemetry: dict,
    target: dict,
    hardware: str,
) -> dict:
    """
    Main fidelity computation function.

    Args:
        earth_telemetry: Dict from telemetry_service.fetch_earth_telemetry()
        target: Dict entry from planetary_targets.json
        hardware: "Rover" | "EVA Suit" | "Habitat"

    Returns:
        Dict containing overall_fidelity_pct, metric_comparisons, risk_assessment, etc.
    """
    tp = target["parameters"]
    hw_mods = target.get("hardware_risk_modifiers", {}).get(hardware, {})

    # ── Earth values (with safe fallbacks) ──────────────────────────────────
    e_temp_mean = _safe(earth_telemetry.get("temperature_mean_c"), 15.0)
    e_temp_min  = _safe(earth_telemetry.get("temperature_min_c"),  5.0)
    e_temp_max  = _safe(earth_telemetry.get("temperature_max_c"), 30.0)
    e_solar     = _safe(earth_telemetry.get("solar_irradiance_wm2"), 180.0)
    e_wind      = _safe(earth_telemetry.get("wind_speed_ms"), 3.0)
    e_precip    = _safe(earth_telemetry.get("precipitation_mm_day"), 2.0)
    e_elev      = _safe(earth_telemetry.get("elevation_m"), 0.0)

    # Estimate Earth atmospheric pressure from elevation (barometric formula)
    e_pressure_atm = math.exp(-e_elev / 8500.0) if e_elev > -500 else 1.0

    # ── Target values ────────────────────────────────────────────────────────
    t_temp_mean = tp["temperature_mean_c"]
    t_temp_min  = tp["temperature_min_c"]
    t_temp_max  = tp["temperature_max_c"]
    t_solar     = tp["solar_irradiance_wm2"]
    t_wind      = tp["wind_speed_ms"]
    t_precip    = tp["precipitation_mm_day"]
    t_pressure  = tp["atmospheric_pressure_atm"]
    t_elev      = tp["elevation_m"]

    # ── Individual metric scores ─────────────────────────────────────────────
    scores = {
        "temperature":   _temperature_score(e_temp_mean, t_temp_mean, t_temp_min, t_temp_max),
        "solar":         _solar_score(e_solar, t_solar),
        "pressure":      _pressure_score(e_pressure_atm, t_pressure),
        "wind":          _wind_score(e_wind, t_wind),
        "precipitation": _precipitation_score(e_precip, t_precip),
        "elevation":     _elevation_score(e_elev, t_elev),
    }

    # ── Weighted overall score ───────────────────────────────────────────────
    raw_fidelity = sum(scores[k] * METRIC_WEIGHTS[k] for k in scores)

    # Apply hardware stress modifiers (reduce score if hardware risk is high)
    thermal_mod = hw_mods.get("thermal_stress_factor", 1.0)
    dust_mod    = hw_mods.get("dust_ingestion_factor", 1.0)
    hw_penalty  = (thermal_mod + dust_mod) / 2.0  # 0–1 penalty factor
    overall_fidelity = round(raw_fidelity * hw_penalty, 1)
    overall_fidelity = max(0.0, min(100.0, overall_fidelity))

    # ── Metric comparison objects ────────────────────────────────────────────
    def _dev(earth_val, target_val):
        if target_val == 0:
            return None if earth_val == 0 else 999.0
        return round(abs(earth_val - target_val) / max(abs(target_val), 1) * 100, 1)

    metric_comparisons = [
        {
            "metric": "Surface Temperature (Mean)",
            "unit": "°C",
            "earth_value": round(e_temp_mean, 1),
            "target_value": t_temp_mean,
            "deviation_pct": _dev(e_temp_mean, t_temp_mean),
            "weight": METRIC_WEIGHTS["temperature"],
            "score": round(scores["temperature"], 1),
        },
        {
            "metric": "Solar Irradiance",
            "unit": "W/m²",
            "earth_value": round(e_solar, 1),
            "target_value": t_solar,
            "deviation_pct": _dev(e_solar, t_solar),
            "weight": METRIC_WEIGHTS["solar"],
            "score": round(scores["solar"], 1),
        },
        {
            "metric": "Atmospheric Pressure",
            "unit": "atm",
            "earth_value": round(e_pressure_atm, 4),
            "target_value": t_pressure,
            "deviation_pct": _dev(e_pressure_atm, t_pressure),
            "weight": METRIC_WEIGHTS["pressure"],
            "score": round(scores["pressure"], 1),
        },
        {
            "metric": "Wind Speed",
            "unit": "m/s",
            "earth_value": round(e_wind, 1),
            "target_value": t_wind,
            "deviation_pct": _dev(e_wind, t_wind),
            "weight": METRIC_WEIGHTS["wind"],
            "score": round(scores["wind"], 1),
        },
        {
            "metric": "Precipitation / Aridity",
            "unit": "mm/day",
            "earth_value": round(e_precip, 2),
            "target_value": t_precip,
            "deviation_pct": _dev(e_precip, t_precip),
            "weight": METRIC_WEIGHTS["precipitation"],
            "score": round(scores["precipitation"], 1),
        },
        {
            "metric": "Terrain Elevation",
            "unit": "m",
            "earth_value": round(e_elev, 0),
            "target_value": t_elev,
            "deviation_pct": _dev(e_elev, t_elev),
            "weight": METRIC_WEIGHTS["elevation"],
            "score": round(scores["elevation"], 1),
        },
    ]

    # ── Operational Risk Assessment ──────────────────────────────────────────
    risk_items = _generate_risk_assessment(
        scores, e_temp_mean, e_temp_min, e_temp_max, e_solar,
        e_wind, e_precip, e_elev, e_pressure_atm,
        target, hardware, hw_mods
    )

    # ── Operational summary ──────────────────────────────────────────────────
    summary = _generate_summary(overall_fidelity, target, hardware, risk_items)

    return {
        "overall_fidelity_pct": overall_fidelity,
        "hardware": hardware,
        "target_id": target["id"],
        "target_name": target["name"],
        "metric_comparisons": metric_comparisons,
        "risk_assessment": risk_items,
        "operational_summary": summary,
        "data_sources": [
            "NASA POWER Climatology API v2.5 (re.larc.nasa.gov)",
            "Open-Elevation API (open-elevation.com)",
            f"NASA LRO Diviner DLRE / {target.get('source', 'NASA PDS')}",
        ],
    }


def _generate_risk_assessment(
    scores, e_temp_mean, e_temp_min, e_temp_max, e_solar,
    e_wind, e_precip, e_elev, e_pressure_atm,
    target, hardware, hw_mods
) -> list:
    """Generate structured risk items based on analog fidelity gaps."""
    items = []
    target_id = target["id"]
    is_moon = target_id == "lunar_south_pole"
    is_mars = target_id == "jezero_crater_mars"

    # Thermal risk
    t_temp_min = target["parameters"]["temperature_min_c"]
    t_temp_max = target["parameters"]["temperature_max_c"]
    temp_score = scores["temperature"]
    if temp_score >= 70:
        items.append({"system": "Thermal Management", "level": "LOW",
                      "detail": f"Earth site ({e_temp_mean:.1f}°C mean) provides adequate thermal analog for {target['shortName']} envelope ({t_temp_min}°C to {t_temp_max}°C)."})
    elif temp_score >= 40:
        items.append({"system": "Thermal Management", "level": "MODERATE",
                      "detail": f"Temperature offset significant. Earth mean {e_temp_mean:.1f}°C vs. target {target['parameters']['temperature_mean_c']}°C. Supplement with cryo/thermal chambers for hardware qualification."})
    else:
        items.append({"system": "Thermal Management", "level": "CRITICAL",
                      "detail": f"Earth site ({e_temp_mean:.1f}°C) is a poor thermal analog for {target['shortName']} ({t_temp_min}°C to {t_temp_max}°C). Thermal qualification must occur in dedicated test facilities."})

    # Pressure / Suit risk
    pressure_score = scores["pressure"]
    if is_moon or is_mars:
        if e_elev < 3000:
            items.append({"system": "Pressure / EVA Protocols", "level": "HIGH",
                          "detail": "Site atmospheric pressure ~1 atm. Near-vacuum target requires pressurized suit operations training in dedicated hypobaric facilities. Analog limited to surface mobility / geology tasks only."})
        else:
            items.append({"system": "Pressure / EVA Protocols", "level": "MODERATE",
                          "detail": f"High-altitude site (elev. {e_elev:.0f}m) reduces pressure to ~{e_pressure_atm:.3f} atm. Partial analog for reduced-O2 suit operations, but cannot replicate vacuum or CO2 atmosphere."})

    # Dust / Regolith risk
    dust_factor = hw_mods.get("dust_ingestion_factor", 1.0)
    if scores["precipitation"] >= 70:
        dust_level = "LOW"
        dust_detail = "Arid site conditions create viable regolith/dust analog for surface operations training."
    elif e_precip <= 2.0:
        dust_level = "MODERATE"
        dust_detail = "Semi-arid. Some seasonal moisture — dust cohesion behavior may differ from target's electrostatically-charged dry regolith."
    else:
        dust_level = "HIGH"
        dust_detail = f"High precipitation ({e_precip:.1f} mm/day) fundamentally alters regolith mobility. Poor analog for dust storm or regolith ingestion scenarios."
    items.append({"system": "Regolith / Dust Ingestion", "level": dust_level, "detail": dust_detail})

    # Power / Solar risk
    solar_score = scores["solar"]
    if solar_score >= 70:
        items.append({"system": "Power Systems", "level": "LOW",
                      "detail": f"Site irradiance ({e_solar:.0f} W/m²) provides viable solar power system analog for target conditions."})
    elif is_moon:
        items.append({"system": "Power Systems", "level": "CRITICAL",
                      "detail": "Lunar PSR receives near-zero solar flux. Earth analog site cannot replicate RTG/nuclear power requirements. Power system testing must occur in covered facilities with controlled irradiance."})
    else:
        items.append({"system": "Power Systems", "level": "MODERATE",
                      "detail": f"Site irradiance ({e_solar:.0f} W/m²) deviates from target ({target['parameters']['solar_irradiance_wm2']} W/m²). Solar array sizing models require correction factor."})

    # Radiation (informational)
    rad = target["parameters"].get("radiation_msv_day", 0)
    if rad > 0:
        items.append({"system": "Radiation Exposure", "level": "HIGH",
                      "detail": f"Target radiation: {rad} mSv/day. Earth analog site provides ~0.001 mSv/day background. No Earth analog replicates GCR/SEP radiation environment. Dedicated shielding tests required."})

    # Communication (always relevant for analog ops)
    items.append({"system": "Communications Latency", "level": "LOW",
                  "detail": "Analog site can simulate communication delay protocols (Moon: 1.3s, Mars: 3–22 min one-way). Deploy timed relay systems for realistic CAPCOM simulation."})

    return items


def _generate_summary(fidelity: float, target: dict, hardware: str, risks: list) -> str:
    """Generate a concise operational summary string."""
    critical_count = sum(1 for r in risks if r["level"] == "CRITICAL")
    high_count = sum(1 for r in risks if r["level"] == "HIGH")

    if fidelity >= 75:
        grade = "HIGH-FIDELITY"
        rec = "Site is recommended for integrated mission rehearsal operations."
    elif fidelity >= 50:
        grade = "MODERATE-FIDELITY"
        rec = "Site is suitable for surface mobility and geology analog training with supplementary facility-based testing."
    elif fidelity >= 30:
        grade = "LOW-FIDELITY"
        rec = "Site provides partial analog value for specific subsystems only. Primary qualification must occur in dedicated test facilities."
    else:
        grade = "NON-ANALOG"
        rec = "Site does not meet minimum analog criteria for the selected target. Select an alternative location."

    return (
        f"{grade} ANALOG — Overall fidelity: {fidelity}% for {hardware} operations targeting {target['name']}. "
        f"{critical_count} CRITICAL and {high_count} HIGH risk items identified. {rec}"
    )
