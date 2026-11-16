# ALTAIR — Analog Location Telemetry Analysis & Intelligence Reporter

**Team Stalred / STRD — NASA Space Apps Challenge**

ALTAIR helps mission planners compare Earth analog sites against the Moon (Lunar South Pole / Shackleton Crater) and Mars (Jezero Crater). Select a target and a location on Earth to fetch telemetry, compute an analog fidelity score, and view an operational risk assessment.

## Challenge alignment & impact
- **Problem:** Identifying and justifying Earth analog sites for planetary missions is time-consuming and often relies on fragmented data.
- **Solution:** A mission-control web app that combines live Earth environmental data with curated NASA planetary reference parameters to rapidly evaluate analog suitability.
- **Users:** Mission designers, analog field teams, educators, and outreach/demo scenarios for planetary exploration.

## Key features
- Mission target selection: Lunar South Pole (Shackleton Crater) and Jezero Crater (Mars)
- Interactive Earth map to pick an analog location
- Live Earth telemetry fetch for selected coordinates
- Fidelity scoring engine comparing Earth vs. planetary conditions
- Operational risk assessment and telemetry visualization
- NASA GIBS map layers for Earth context

## Data sources (real vs. computed)
| Data | Source | Type |
|---|---|---|
| Earth surface climatology (temperature, solar irradiance, wind, precipitation) | [NASA POWER Climatology API](https://power.larc.nasa.gov/) | **Live API (queried at runtime)** |
| Earth elevation | [Open-Elevation API](https://api.open-elevation.com/) | **Live API (queried at runtime)** |
| Lunar South Pole parameters | NASA LRO Diviner (DLRE) reference values, curated in project | **Static reference (NASA-sourced)** |
| Mars Jezero Crater parameters | Perseverance MEDA / MRO CRISM / NASA PDS reference values, curated in project | **Static reference (NASA-sourced)** |
| Earth map imagery layers | [NASA GIBS](https://earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs) | **Live tile services** |
| Analog fidelity score & risk assessment | ALTAIR engine (`backend/app/services/fidelity_engine.py`) | **Computed by ALTAIR from above data** |

> No API keys are required for the default public data sources used by this project.

## Architecture
- **Frontend:** React + Vite + Tailwind + Leaflet (`frontend/`)
- **Backend:** FastAPI (`backend/`)
- **Core services:**
  - `backend/app/services/telemetry_service.py` — fetches live Earth telemetry (NASA POWER + Open-Elevation)
  - `backend/app/services/fidelity_engine.py` — computes fidelity score and risk assessment
  - `backend/data/planetary_targets.json` — curated NASA planetary reference targets

## Prerequisites
| Tool | Minimum version | Download |
|---|---|---|
| Python | 3.10+ | https://python.org/downloads |
| Node.js | 18+ | https://nodejs.org |
| Git | any | https://git-scm.com |

## Setup (first time)

```bash
git clone <your-repo-url>
cd ALTAIR
```

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Windows (cmd):
.venv\Scripts\activate
# macOS / Linux:
# source .venv/bin/activate

pip install -r requirements.txt
copy .env.template .env  # Windows (cmd)
# cp .env.template .env  # macOS/Linux/PowerShell
```

### 2. Frontend (React / Vite)

```bash
cd frontend
npm install
```

## Run the application
You need **two terminals** running at the same time.

### Terminal 1 — Backend
```bash
cd backend
.venv\Scripts\Activate.ps1   # Windows PowerShell
uvicorn main:app --reload --port 8000
```
Backend ready at: `http://localhost:8000` (Swagger UI: `http://localhost:8000/api/docs`)

### Terminal 2 — Frontend
```bash
cd frontend
npm run dev
```
Frontend ready at: `http://localhost:5173`

> Both servers must be running. The frontend calls the backend at `http://localhost:8000`.

## Quick demo flow (for judges)
1. Open `http://localhost:5173`
2. Select **Moon** or **Mars** mission target
3. Click a location on the Earth map (or choose a preset, if available)
4. Run analysis to view live Earth telemetry, fidelity score, and risk assessment

## Limitations & next steps
- Planetary target parameters are curated NASA reference values (not fetched live per-point) due to the complexity of mission datasets and hackathon time constraints.
- Fidelity/risk scoring is a heuristic model for analog comparison and decision support, not a flight-certified assessment.
- **Next steps:** integrate additional NASA datasets (e.g., MRO/MGS products, more landing sites), add temporal/weather variability, exportable reports, and validation against known analog sites.

## Project structure
```text
ALTAIR/
├── backend/                  # Python FastAPI
│   ├── main.py               # App entrypoint
│   ├── requirements.txt
│   ├── .env.template
│   ├── data/
│   │   └── planetary_targets.json
│   └── app/
│       ├── api/endpoints/    # /planets, /analysis
│       └── services/         # NASA POWER/Open-Elevation + fidelity engine
└── frontend/                 # React + Vite
    └── src/
        ├── views/            # Main screens
        ├── components/       # Map, telemetry, panels
        └── api/              # Backend client
```

---
*Team Stalred / STRD — NASA Space Apps Challenge 2026*
