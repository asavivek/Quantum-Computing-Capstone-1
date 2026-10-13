import uuid
import io
import csv
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends, Query, Response
from fastapi.responses import StreamingResponse

from app.schemas import PredictionInput, PredictionOutput
from app.database import PredictionRepository
from app.api.auth import get_optional_user, get_current_user
from app.services.prediction_service import PredictionService
from app.services.report_generator import generate_prediction_pdf

router = APIRouter()

@router.post("/predict", response_model=PredictionOutput)
def create_prediction(
    payload: PredictionInput,
    user: Optional[dict] = Depends(get_optional_user)
):
    """
    Executes crop yield prediction across classical models and genuine Qiskit quantum kernel SVR.
    Persists prediction record to SQLite and calculates rule-based agronomic advisory.
    """
    user_id = user["id"] if user else "guest-researcher-001"
    inputs_dict = payload.model_dump()

    try:
        pred_result = PredictionService.execute_prediction(
            inputs=inputs_dict,
            selected_model=payload.selected_model or "hist_gb"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction execution failure: {str(e)}")

    record_id = str(uuid.uuid4())
    created_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    pred_record = {
        "id": record_id,
        "user_id": user_id,
        "crop": payload.crop,
        "region": payload.region,
        "season": payload.season,
        "soil_type": payload.soil_type,
        "area_hectares": float(payload.area_hectares),
        "inputs": inputs_dict,
        "selected_model": pred_result["selected_model"],
        "predicted_yield": pred_result["predicted_yield"],
        "confidence_lower": pred_result["confidence_lower"],
        "confidence_upper": pred_result["confidence_upper"],
        "unit": pred_result["unit"],
        "total_farm_yield_tons": pred_result["total_farm_yield_tons"],
        "model_results": pred_result["model_results"],
        "quantum_metadata": pred_result["quantum_metadata"],
        "agronomic_insights": pred_result["agronomic_insights"],
        "created_at": created_at
    }

    PredictionRepository.create(pred_record)
    return pred_record

@router.get("/history", response_model=List[PredictionOutput])
def get_prediction_history(
    crop: Optional[str] = Query(None),
    model: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    user: Optional[dict] = Depends(get_optional_user)
):
    """
    Retrieves historical yield predictions with optional crop and model filtering.
    """
    user_id = user["id"] if user else None
    predictions = PredictionRepository.list_all(user_id=user_id, limit=limit)

    if crop:
        predictions = [p for p in predictions if p["crop"].lower() == crop.lower()]
    if model:
        predictions = [p for p in predictions if p["selected_model"].lower() == model.lower()]

    return predictions

@router.get("/stats")
def get_prediction_stats():
    """
    Returns platform-wide summary statistics for the dashboard.
    """
    count = PredictionRepository.get_count()
    recent = PredictionRepository.list_all(limit=1)
    latest_yield = recent[0]["predicted_yield"] if recent else 3.8
    latest_crop = recent[0]["crop"] if recent else "Wheat"
    latest_region = recent[0]["region"] if recent else "Midwest Plains"

    return {
        "total_predictions": count,
        "latest_predicted_yield": latest_yield,
        "latest_crop": latest_crop,
        "latest_region": latest_region,
        "simulator_status": "Operational (Qiskit Aer / Statevector)",
        "models_count": 5
    }

@router.get("/export/csv")
def export_predictions_csv(user: Optional[dict] = Depends(get_optional_user)):
    """
    Exports all predictions to a downloadable CSV spreadsheet.
    """
    user_id = user["id"] if user else None
    predictions = PredictionRepository.list_all(user_id=user_id, limit=500)

    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "Prediction ID", "Timestamp", "Crop", "Region", "Season", "Soil Type",
        "Field Area (ha)", "Soil pH", "Nitrogen (kg/ha)", "Phosphorus (kg/ha)",
        "Potassium (kg/ha)", "SOC (%)", "Temperature (°C)", "Rainfall (mm)",
        "Humidity (%)", "Soil Moisture (%)", "Selected Model", "Predicted Yield (t/ha)",
        "90% CI Lower (t/ha)", "90% CI Upper (t/ha)", "Total Production (tons)"
    ])

    for p in predictions:
        inp = p.get("inputs", {})
        writer.writerow([
            p.get("id"),
            p.get("created_at"),
            p.get("crop"),
            p.get("region"),
            p.get("season"),
            p.get("soil_type"),
            p.get("area_hectares"),
            inp.get("soil_ph"),
            inp.get("soil_nitrogen"),
            inp.get("soil_phosphorus"),
            inp.get("soil_potassium"),
            inp.get("soil_organic_carbon"),
            inp.get("temperature"),
            inp.get("rainfall"),
            inp.get("humidity"),
            inp.get("soil_moisture"),
            p.get("selected_model"),
            p.get("predicted_yield"),
            p.get("confidence_lower"),
            p.get("confidence_upper"),
            p.get("total_farm_yield_tons", round(float(p.get("predicted_yield", 0)) * float(p.get("area_hectares", 1)), 2))
        ])

    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=quantumyield_predictions_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
    )

@router.get("/{prediction_id}", response_model=PredictionOutput)
def get_prediction_detail(prediction_id: str):
    """
    Retrieves full details of a single prediction by ID.
    """
    pred = PredictionRepository.get_by_id(prediction_id)
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction record not found.")
    return pred

@router.delete("/{prediction_id}")
def delete_prediction(prediction_id: str, current_user: dict = Depends(get_current_user)):
    """
    Deletes an individual prediction record.
    """
    deleted = PredictionRepository.delete(prediction_id, user_id=current_user["id"])
    if not deleted:
        # Check if exists without user_id check
        deleted_any = PredictionRepository.delete(prediction_id)
        if not deleted_any:
            raise HTTPException(status_code=404, detail="Prediction record not found.")
    return {"status": "ok", "message": "Prediction record deleted successfully."}

@router.get("/{prediction_id}/export/pdf")
def export_prediction_pdf(prediction_id: str):
    """
    Generates and streams a formatted PDF evaluation report.
    """
    pred = PredictionRepository.get_by_id(prediction_id)
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction record not found.")

    pdf_buffer = generate_prediction_pdf(pred)
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=quantumyield_report_{prediction_id[:8]}.pdf"}
    )
