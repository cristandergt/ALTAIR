/**
 * ALTAIR — API Client
 * Communicates with the FastAPI backend.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `API Error ${res.status}`)
  }
  return res.json()
}

/** Fetch all planetary targets */
export const fetchPlanets = () => apiFetch('/planets/')

/** Fetch a single planetary target by ID */
export const fetchPlanet = (id) => apiFetch(`/planets/${id}`)

/** Fetch preset Earth analog locations */
export const fetchPresets = () => apiFetch('/analysis/presets')

/**
 * Run fidelity analysis for given coordinates
 * @param {{ lat: number, lon: number, target_id: string, hardware: string }} params
 */
export const runAnalysis = (params) =>
  apiFetch('/analysis/', {
    method: 'POST',
    body: JSON.stringify(params),
  })
