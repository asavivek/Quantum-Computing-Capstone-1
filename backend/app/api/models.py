import os
import json
from typing import Dict, Any

from fastapi import APIRouter, HTTPException
from app.services.prediction_service import PredictionService, MODELS_DIR
from app.ml.trainer import train_and_evaluate_all_models

router = APIRouter()

@router.get("/")
def list_available_models():
    """
    Lists all classical and quantum prediction models deployed on the platform.
    """
    PredictionService.load_artifacts()
    bm = PredictionService.get_benchmark()
    models_meta = bm.get("models", {})

    return [
        {
            "key": "dummy",
            "name": "Dummy Regressor Baseline",
            "family": "Baseline",
            "description": "Predicts mean historical yield as a non-learning benchmark control.",
            "metrics": models_meta.get("dummy", {}),
            "status": "ready"
        },
        {
            "key": "random_forest",
            "name": "Random Forest Regressor",
            "family": "Classical Ensemble",
            "description": "Bagged ensemble of 100 deep decision trees capturing nonlinear soil-climate interactions.",
            "metrics": models_meta.get("random_forest", {}),
            "status": "ready"
        },
        {
            "key": "hist_gb",
            "name": "HistGradientBoosting Regressor",
            "family": "Classical Boosting",
            "description": "Histogram-based gradient boosted decision trees optimized for continuous tabular agricultural data.",
            "metrics": models_meta.get("hist_gb", {}),
            "status": "ready"
        },
        {
            "key": "classical_svr",
            "name": "Classical Support Vector Regressor (RBF)",
            "family": "Classical Kernel Method",
            "description": "Dual optimization kernel regressor with Radial Basis Function (RBF) in infinite-dimensional Euclidean space.",
            "metrics": models_meta.get("classical_svr", {}),
            "status": "ready"
        },
        {
            "key": "quantum_svr",
            "name": "Quantum Fidelity-Kernel Regressor (Qiskit)",
            "family": "Quantum Machine Learning",
            "description": "ZZFeatureMap quantum state fidelity kernel simulated via Qiskit Aer / Statevector.",
            "metrics": models_meta.get("quantum_svr", {}),
            "status": "ready"
        }
    ]

@router.get("/compare")
def get_model_comparison():
    """
    Returns authentic side-by-side benchmark metrics and parity scatter plot data
    computed on identical evaluation test samples.
    """
    PredictionService.load_artifacts()
    bm = PredictionService.get_benchmark()
    if not bm:
        raise HTTPException(status_code=404, detail="Benchmark metrics not found. Models may need training.")

    analysis = (
        "Scientific Analysis: On tabular agricultural data with heterogeneous continuous features "
        "(soil chemistry, moisture, temperature), Classical Tree Ensembles (HistGradientBoosting and Random Forest) "
        "substantially outperform both Classical SVR and Quantum Fidelity-Kernel SVR. "
        "The Quantum Kernel encodes features into periodic rotation angles (RZ and RZZ gates); without a structured "
        "group-theoretic inductive bias or quantum data source, tabular feature splits are better partitioned by "
        "axis-aligned decision trees. Furthermore, classical simulation of quantum kernels incurs an O(N^2) "
        "computational cost, making classical inference orders of magnitude faster."
    )

    return {
        "benchmark": bm,
        "scientific_analysis": analysis,
        "evaluation_protocol": {
            "test_split_ratio": 0.20,
            "random_seed": 42,
            "leakage_protection": "Preprocessor fitted strictly on training partition",
            "quantum_encoding": "PCA-4 followed by [0, pi] angle scaling into ZZFeatureMap"
        }
    }

@router.post("/retrain")
def trigger_retraining():
    """
    Executes a complete re-training and re-benchmarking pass of all 5 models.
    """
    try:
        updated_meta = train_and_evaluate_all_models()
        PredictionService._models.clear()
        PredictionService.load_artifacts()
        return {"status": "ok", "message": "Models successfully retrained.", "summary": updated_meta["models"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")
