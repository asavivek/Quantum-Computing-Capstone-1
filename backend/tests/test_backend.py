import pytest
import numpy as np
from fastapi.testclient import TestClient

import sys
import os

# Insert backend directory into path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.database import UserRepository, PredictionRepository
from app.quantum.kernel import (
    get_feature_map,
    compute_quantum_kernel_matrix,
    evaluate_fidelity_pair,
    get_circuit_metadata
)
from app.services.prediction_service import PredictionService

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["qiskit_version"] is not None
    assert data["database_connected"] is True
    assert data["models_loaded"] is True

def test_auth_registration_and_login():
    test_email = "agri_test_user_42@example.com"
    # Registration
    reg_res = client.post("/api/auth/register", json={
        "email": test_email,
        "full_name": "Agri Researcher",
        "password": "secure_password_99"
    })
    # If user already registered in prior run, login should work
    if reg_res.status_code == 200:
        token = reg_res.json()["access_token"]
        assert token is not None
    
    # Login
    login_res = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "secure_password_99"
    })
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert data["user"]["email"] == test_email

    # Me endpoint with bearer token
    token = data["access_token"]
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == test_email

def test_guest_auth():
    res = client.post("/api/auth/guest")
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert "guest" in data["user"]["email"]

def test_models_list_and_comparison():
    res = client.get("/api/models/")
    assert res.status_code == 200
    models_list = res.json()
    assert len(models_list) == 5
    keys = [m["key"] for m in models_list]
    assert "hist_gb" in keys
    assert "random_forest" in keys
    assert "quantum_svr" in keys
    assert "classical_svr" in keys
    assert "dummy" in keys

    # Compare endpoint
    comp_res = client.get("/api/models/compare")
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert "benchmark" in comp_data
    assert "models" in comp_data["benchmark"]
    assert "parity_data" in comp_data["benchmark"]

def test_prediction_valid_and_database_persistence():
    payload = {
        "crop": "Wheat",
        "region": "Midwest Plains",
        "season": "Rabi/Winter",
        "soil_type": "Loam",
        "soil_ph": 6.5,
        "soil_nitrogen": 120.0,
        "soil_phosphorus": 50.0,
        "soil_potassium": 140.0,
        "soil_organic_carbon": 1.4,
        "temperature": 21.0,
        "rainfall": 480.0,
        "humidity": 58.0,
        "soil_moisture": 36.0,
        "area_hectares": 10.0,
        "selected_model": "hist_gb"
    }

    res = client.post("/api/predictions/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "id" in data
    pred_id = data["id"]
    assert data["predicted_yield"] > 0
    assert data["confidence_lower"] <= data["predicted_yield"]
    assert data["confidence_upper"] >= data["predicted_yield"]
    assert len(data["model_results"]) == 5
    assert data["quantum_metadata"]["qubits"] == 4
    assert len(data["agronomic_insights"]["recommendations"]) > 0

    # Verify persistence via get detail
    detail_res = client.get(f"/api/predictions/{pred_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == pred_id

    # Verify PDF export
    pdf_res = client.get(f"/api/predictions/{pred_id}/export/pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 1000

def test_prediction_invalid_bounds():
    # Soil pH out of range (ge=4.0, le=9.0)
    bad_payload = {
        "crop": "Corn",
        "soil_ph": 14.5  # Invalid pH
    }
    res = client.post("/api/predictions/predict", json=bad_payload)
    assert res.status_code == 422  # Pydantic validation error

def test_quantum_circuit_metadata():
    res = client.get("/api/quantum/circuit?fmap_name=zz&num_qubits=4&reps=2&entanglement=linear")
    assert res.status_code == 200
    data = res.json()
    assert data["num_qubits"] == 4
    assert data["depth"] > 0
    assert data["total_gates"] > 0
    assert data["two_qubit_gates"] > 0
    assert "ascii_diagram" in data
    assert len(data["gate_sequence"]) > 0

def test_quantum_kernel_symmetry_and_diagonal():
    # Compute kernel matrix for 5 samples
    res = client.post("/api/quantum/kernel-matrix", json={
        "fmap_name": "zz",
        "num_qubits": 4,
        "reps=2": 2,
        "entanglement": "linear",
        "mode": "statevector",
        "sample_count": 6
    })
    assert res.status_code == 200
    data = res.json()
    matrix = np.array(data["matrix"])
    assert matrix.shape == (6, 6)
    assert data["is_symmetric"] is True
    assert np.allclose(np.diag(matrix), 1.0, atol=1e-3)
    assert data["mean_diagonal"] == 1.0

def test_quantum_pair_fidelity():
    res = client.post("/api/quantum/simulate-pair", json={
        "fmap_name": "zz",
        "num_qubits": 4,
        "x1": [0.5, 1.2, 0.8, 1.5],
        "x2": [0.5, 1.2, 0.8, 1.5],  # Identical vectors
        "mode": "statevector"
    })
    assert res.status_code == 200
    data = res.json()
    assert np.isclose(data["exact_fidelity"], 1.0, atol=1e-4)

def test_csv_export():
    res = client.get("/api/predictions/export/csv")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert b"Prediction ID" in res.content
