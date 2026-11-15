"""
ALTAIR — API Router
Aggregates all endpoint modules.
"""

from fastapi import APIRouter
from app.api.endpoints import planets, analysis

api_router = APIRouter()

api_router.include_router(planets.router, prefix="/planets", tags=["Planetary Targets"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["Fidelity Analysis"])
