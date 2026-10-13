import sys
import os
import json
import httpx
import numpy as np

base_url = 'http://127.0.0.1:8000/api'
client = httpx.Client(timeout=30.0)

def run_e2e_tests():
    print("================================================================")
    print(" QUANTUMYIELD AI — END-TO-END SYSTEM INTEGRATION TEST SUITE")
    print("================================================================")

    # 1. Health Endpoint
    print("\n[TEST 1/11] Checking System Health & Qiskit Simulator Status...")
    res = client.get(f"{base_url}/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health = res.json()
    print(f"  --> Status: {health['status'].upper()}")
    print(f"  --> Qiskit Version: {health['qiskit_version']}")
    print(f"  --> Qiskit Aer Available: {health['qiskit_aer_available']}")
    print(f"  --> Database: {health['database_type']} (Connected: {health['database_connected']})")
    print(f"  --> Models Ready: {health['models_loaded']}")

    # 2. Guest Researcher Authentication
    print("\n[TEST 2/11] Authenticating Guest Evaluator...")
    res = client.post(f"{base_url}/auth/guest")
    assert res.status_code == 200, f"Guest auth failed: {res.text}"
    auth_data = res.json()
    token = auth_data["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    print(f"  --> Authenticated: {auth_data['user']['full_name']} ({auth_data['user']['email']})")

    # 3. Model Benchmark & Parity Metadata
    print("\n[TEST 3/11] Querying 5-Model Benchmark Suite...")
    res = client.get(f"{base_url}/models/compare")
    assert res.status_code == 200, f"Model compare failed: {res.text}"
    comp = res.json()
    models = comp["benchmark"]["models"]
    for k, m in models.items():
        print(f"  --> {m['name']}: R²={m['r2']}, MAE={m['mae']}, Latency={m['latency_per_sample_ms']}ms")

    # 4. Multi-Model Crop Yield Prediction
    print("\n[TEST 4/11] Executing Yield Prediction with Agronomic & Quantum SVR...")
    payload = {
        "crop": "Corn",
        "region": "Corn Belt",
        "season": "Summer/Zaid",
        "soil_type": "Loam",
        "soil_ph": 6.6,
        "soil_nitrogen": 165.0,
        "soil_phosphorus": 62.0,
        "soil_potassium": 130.0,
        "soil_organic_carbon": 2.2,
        "temperature": 27.0,
        "rainfall": 680.0,
        "humidity": 64.0,
        "soil_moisture": 38.0,
        "area_hectares": 20.0,
        "selected_model": "hist_gb"
    }
    res = client.post(f"{base_url}/predictions/predict", json=payload)
    assert res.status_code == 200, f"Prediction failed: {res.text}"
    pred = res.json()
    pred_id = pred["id"]
    print(f"  --> Prediction ID: {pred_id}")
    print(f"  --> Primary Yield: {pred['predicted_yield']} {pred['unit']}")
    print(f"  --> 90% Prediction Interval: [{pred['confidence_lower']} — {pred['confidence_upper']}] {pred['unit']}")
    print(f"  --> Total Projected Farm Harvest: {pred['total_farm_yield_tons']} metric tons")
    print(f"  --> Quantum Execution: {pred['quantum_metadata']['qubits']} Qubits, {pred['quantum_metadata']['feature_map']}")

    # 5. Prediction History Persistence
    print("\n[TEST 5/11] Verifying SQLite Persistence...")
    res = client.get(f"{base_url}/predictions/history?limit=10")
    assert res.status_code == 200, f"History fetch failed: {res.text}"
    history = res.json()
    found = any(p["id"] == pred_id for p in history)
    assert found, "Saved prediction not found in persistent history!"
    print(f"  --> Successfully retrieved {len(history)} records. Target record verified.")

    # 6. PDF Report Generation
    print("\n[TEST 6/11] Generating Formatted PDF Report via ReportLab...")
    res = client.get(f"{base_url}/predictions/{pred_id}/export/pdf")
    assert res.status_code == 200, f"PDF export failed: {res.text}"
    assert res.headers["content-type"] == "application/pdf"
    assert len(res.content) > 1000
    print(f"  --> PDF Document Generated Successfully ({len(res.content)} bytes)")

    # 7. CSV Export
    print("\n[TEST 7/11] Exporting Full Audit Dataset to CSV...")
    res = client.get(f"{base_url}/predictions/export/csv")
    assert res.status_code == 200, f"CSV export failed: {res.text}"
    assert "text/csv" in res.headers["content-type"]
    print(f"  --> CSV Spreadsheet Generated Successfully ({len(res.content)} bytes)")

    # 8. Qiskit Circuit Details & Decomposition
    print("\n[TEST 8/11] Extracting Native Qiskit Circuit Metadata...")
    res = client.get(f"{base_url}/quantum/circuit?fmap_name=zz&num_qubits=4&reps=2&entanglement=linear")
    assert res.status_code == 200, f"Circuit metadata failed: {res.text}"
    circ = res.json()
    print(f"  --> Circuit Depth: {circ['depth']}")
    print(f"  --> Total Quantum Gates: {circ['total_gates']} (Single-qubit: {circ['single_qubit_gates']}, Entangling CX: {circ['two_qubit_gates']})")

    # 9. Real Quantum Kernel Gram Matrix Computation
    print("\n[TEST 9/11] Computing 6x6 Quantum Kernel Matrix on Real Agricultural Samples...")
    res = client.post(f"{base_url}/quantum/kernel-matrix", json={
        "fmap_name": "zz",
        "num_qubits": 4,
        "reps": 2,
        "entanglement": "linear",
        "mode": "statevector",
        "sample_count": 6
    })
    assert res.status_code == 200, f"Kernel matrix failed: {res.text}"
    km = res.json()
    matrix = np.array(km["matrix"])
    print(f"  --> Matrix Dimension: {km['dimension']}x{km['dimension']}")
    print(f"  --> Matrix Symmetry Verified: {km['is_symmetric']}")
    print(f"  --> Mean Diagonal: {km['mean_diagonal']}")
    print(f"  --> Matrix Computation Time: {km['computation_time_ms']} ms")
    assert km["is_symmetric"] is True, "Quantum kernel matrix must be symmetric!"
    assert np.allclose(np.diag(matrix), 1.0, atol=1e-3), "Diagonal entries must equal 1.0!"

    # 10. Quantum State Overlap Simulation
    print("\n[TEST 10/11] Evaluating State Fidelity Between Two Feature Vectors...")
    res = client.post(f"{base_url}/quantum/simulate-pair", json={
        "fmap_name": "zz",
        "num_qubits": 4,
        "reps": 2,
        "entanglement": "linear",
        "x1": [1.57, 0.78, 2.35, 1.20],
        "x2": [1.57, 0.78, 2.35, 1.20],
        "mode": "statevector"
    })
    assert res.status_code == 200, f"Pair simulation failed: {res.text}"
    pair = res.json()
    print(f"  --> Identical Vector Exact Fidelity: {pair['exact_fidelity']} (Expected: 1.0)")
    assert np.isclose(pair["exact_fidelity"], 1.0, atol=1e-4)

    # 11. Agronomic Guidelines
    print("\n[TEST 11/11] Fetching Agronomic Decision Support Rules...")
    res = client.get(f"{base_url}/agronomy/guidelines")
    assert res.status_code == 200, f"Guidelines failed: {res.text}"
    ag = res.json()
    print(f"  --> Available Crop Guidelines: {list(ag['crops'].keys())}")

    print("\n================================================================")
    print(" ALL 11 END-TO-END INTEGRATION TESTS PASSED WITH 100% SUCCESS!")
    print("================================================================")

if __name__ == '__main__':
    run_e2e_tests()
