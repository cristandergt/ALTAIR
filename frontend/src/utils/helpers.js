/**
 * ALTAIR — Utility helpers
 */

/**
 * Format a number with a fixed number of decimal places,
 * returning '—' if the value is null/undefined.
 */
export function fmt(value, decimals = 1, suffix = '') {
  if (value == null || isNaN(value)) return '—'
  return `${Number(value).toFixed(decimals)}${suffix}`
}

/**
 * Returns a Tailwind-compatible class string for a given
 * risk level string: LOW | MODERATE | HIGH | CRITICAL
 */
export function riskColorClass(level) {
  switch (level?.toUpperCase()) {
    case 'LOW':      return 'text-green-ok'
    case 'MODERATE': return 'text-amber'
    case 'HIGH':     return 'text-amber'
    case 'CRITICAL': return 'text-crimson'
    default:         return 'text-text-secondary'
  }
}

/**
 * Clamps a number between min and max.
 */
export function clamp(value, min = 0, max = 100) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Returns a human-readable cardinal direction from a longitude.
 */
export function lonDirection(lon) {
  return lon >= 0 ? 'E' : 'W'
}

/**
 * Returns a human-readable cardinal direction from a latitude.
 */
export function latDirection(lat) {
  return lat >= 0 ? 'N' : 'S'
}

/**
 * Format coordinates as a DMS-style string.
 */
export function formatCoords(lat, lon) {
  if (lat == null || lon == null) return '—'
  return `${Math.abs(lat).toFixed(4)}°${latDirection(lat)} ${Math.abs(lon).toFixed(4)}°${lonDirection(lon)}`
}
