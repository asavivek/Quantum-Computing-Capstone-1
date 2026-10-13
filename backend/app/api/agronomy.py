from fastapi import APIRouter
from typing import Dict, Any

from app.services.agronomy import (
    CROP_AGRONOMIC_STANDARDS,
    generate_agronomic_recommendations
)
from app.schemas import PredictionInput

router = APIRouter()

@router.get("/guidelines")
def get_agronomic_guidelines():
    """
    Returns verified crop agronomic thresholds from FAO and ICAR benchmarks.
    """
    return {
        "crops": CROP_AGRONOMIC_STANDARDS,
        "disclaimer": (
            "Nutrient, pH, and hydrological guidelines are derived from FAO Drainage Paper 56, "
            "IRRI, and ICAR published agronomic handbooks."
        )
    }

@router.post("/evaluate")
def evaluate_field_agronomy(payload: PredictionInput):
    """
    Evaluates field inputs and returns targeted agronomic recommendations.
    """
    inputs_dict = payload.model_dump()
    # Estimate a baseline yield if evaluating standalone
    base_yield = CROP_AGRONOMIC_STANDARDS.get(payload.crop, {}).get('base_yield', 4.0)
    return generate_agronomic_recommendations(inputs_dict, predicted_yield=base_yield)
