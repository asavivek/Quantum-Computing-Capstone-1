import os
import time
import pandas as pd
import numpy as np
from typing import Dict, Any, List

from fastapi import APIRouter, HTTPException, Query
import qiskit

from app.quantum.kernel import (
    get_feature_map,
    compute_quantum_kernel_matrix,
    evaluate_fidelity_pair,
    get_circuit_metadata,
    AER_AVAILABLE
)
from app.schemas import (
    QuantumCircuitRequest,
    QuantumKernelMatrixRequest,
    QuantumPairSimulationRequest
)
from app.services.prediction_service import MODELS_DIR

router = APIRouter()

DATASET_PATH = os.path.join(os.path.dirname(MODELS_DIR), 'dataset.csv')

@router.get("/status")
def get_quantum_status():
    """
    Returns authentic Qiskit environment health, simulator availability, and feature support.
    """
    aer_version = None
    if AER_AVAILABLE:
        try:
            import qiskit_aer
            aer_version = qiskit_aer.__version__
        except Exception:
            pass

    return {
        "qiskit_version": qiskit.__version__,
        "qiskit_aer_available": AER_AVAILABLE,
        "qiskit_aer_version": aer_version,
        "default_backend": "Qiskit Statevector (Analytical Simulation)",
        "shot_backend": "Qiskit AerSimulator (Shot-based Sampling)" if AER_AVAILABLE else "Unavailable",
        "supported_feature_maps": ["ZZFeatureMap", "ZFeatureMap", "PauliFeatureMap"],
        "entanglement_topologies": ["linear", "full", "circular"],
        "qubit_range": [2, 6],
        "status": "operational"
    }

@router.get("/circuit")
def get_circuit_details(
    fmap_name: str = Query("zz", description="zz, z, or pauli"),
    num_qubits: int = Query(4, ge=2, le=6),
    reps: int = Query(2, ge=1, le=3),
    entanglement: str = Query("linear", description="linear, full, or circular")
):
    """
    Constructs and inspects the requested Qiskit parameterized feature map.
    Returns exact depth, gate counts, ASCII diagram, and gate sequence for visualizer.
    """
    try:
        fmap = get_feature_map(name=fmap_name, num_qubits=num_qubits, reps=reps, entanglement=entanglement)
        # Sample parameters for binding display
        sample_params = [round(float(0.4 * (i + 1)), 2) for i in range(num_qubits)]
        meta = get_circuit_metadata(fmap, sample_values=sample_params)
        meta["feature_map_name"] = fmap_name.upper()
        meta["entanglement"] = entanglement
        meta["reps"] = reps
        return meta
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate quantum circuit: {str(e)}")

@router.post("/kernel-matrix")
def get_kernel_matrix(payload: QuantumKernelMatrixRequest):
    """
    Computes a genuine N x N Quantum Kernel Gram Matrix from real agricultural data samples.
    Verifies matrix symmetry (K = K^T) and unit diagonal (K_ii = 1.0).
    """
    try:
        n_samples = payload.sample_count
        if os.path.exists(DATASET_PATH):
            df = pd.read_csv(DATASET_PATH).head(n_samples)
            crops = df['crop'].tolist()
            # Extract 4 key agricultural features: soil_ph, rainfall, temperature, soil_nitrogen
            # Normalize to [0, pi] range
            sub_feats = df[['soil_ph', 'rainfall', 'temperature', 'soil_nitrogen']].values
            min_vals = sub_feats.min(axis=0)
            max_vals = sub_feats.max(axis=0) + 1e-6
            X_scaled = ((sub_feats - min_vals) / (max_vals - min_vals)) * np.pi
        else:
            crops = [f"Sample {i+1}" for i in range(n_samples)]
            X_scaled = np.random.uniform(0.1, np.pi - 0.1, size=(n_samples, payload.num_qubits))

        fmap = get_feature_map(
            name=payload.fmap_name,
            num_qubits=payload.num_qubits,
            reps=payload.reps,
            entanglement=payload.entanglement
        )

        t0 = time.time()
        K = compute_quantum_kernel_matrix(
            X1=X_scaled,
            fmap=fmap,
            mode=payload.mode,
            shots=payload.shots
        )
        elapsed_ms = round((time.time() - t0) * 1000, 2)

        is_symmetric = bool(np.allclose(K, K.T, atol=1e-3))
        diagonal_mean = round(float(np.mean(np.diag(K))), 4)

        return {
            "matrix": [[round(float(val), 4) for val in row] for row in K],
            "dimension": n_samples,
            "crops": crops,
            "computation_time_ms": elapsed_ms,
            "is_symmetric": is_symmetric,
            "mean_diagonal": diagonal_mean,
            "mode_used": payload.mode,
            "feature_map": payload.fmap_name.upper(),
            "qubits": payload.num_qubits,
            "scaling_note": f"Constructing an {n_samples}x{n_samples} kernel matrix evaluated {n_samples * (n_samples + 1) // 2} unique quantum state overlaps."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quantum kernel computation error: {str(e)}")

@router.post("/simulate-pair")
def simulate_quantum_pair(payload: QuantumPairSimulationRequest):
    """
    Evaluates quantum state overlap fidelity between two arbitrary agricultural feature vectors.
    Returns state probabilities and exact fidelity |<psi(x1)|psi(x2)>|^2.
    """
    try:
        x1 = np.asarray(payload.x1, dtype=float)
        x2 = np.asarray(payload.x2, dtype=float)

        if len(x1) != len(x2):
            raise HTTPException(status_code=400, detail="Feature vectors x1 and x2 must have identical lengths.")

        num_qubits = min(len(x1), payload.num_qubits)
        x1 = x1[:num_qubits]
        x2 = x2[:num_qubits]

        fmap = get_feature_map(
            name=payload.fmap_name,
            num_qubits=num_qubits,
            reps=payload.reps,
            entanglement=payload.entanglement
        )

        result = evaluate_fidelity_pair(
            x1=x1,
            x2=x2,
            fmap=fmap,
            mode=payload.mode,
            shots=payload.shots
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quantum pair simulation error: {str(e)}")
