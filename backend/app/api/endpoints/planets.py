"""
ALTAIR — /api/v1/planets endpoints
Returns the planetary reference dataset derived from NASA LRO/PDS data.
"""

import json
from pathlib import Path
from fastapi import APIRouter, HTTPException

router = APIRouter()

DATA_PATH = Path(__file__).parent.parent.parent.parent / "data" / "planetary_targets.json"

def _load_targets():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@router.get("/", summary="List all planetary analog targets")
async def list_targets():
    """
    Returns the full list of scientifically validated planetary analog targets,
    sourced from NASA LRO Diviner DLRE, Perseverance MEDA, and NASA PDS datasets.
    """
    return _load_targets()


@router.get("/{target_id}", summary="Get a specific planetary target by ID")
async def get_target(target_id: str):
    """
    Returns full parameters for a specific planetary target.
    """
    targets = _load_targets()
    for t in targets:
        if t["id"] == target_id:
            return t
    raise HTTPException(status_code=404, detail=f"Target '{target_id}' not found.")
