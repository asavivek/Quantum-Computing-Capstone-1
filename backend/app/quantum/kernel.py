import os
import time
import numpy as np
from typing import Dict, Any, List, Optional, Tuple

import qiskit
from qiskit import QuantumCircuit
from qiskit.circuit.library import zz_feature_map, z_feature_map, pauli_feature_map
from qiskit.quantum_info import Statevector
from sklearn.base import BaseEstimator, RegressorMixin
from sklearn.svm import SVR

try:
    from qiskit_aer import AerSimulator
    AER_AVAILABLE = True
except ImportError:
    AER_AVAILABLE = False
    AerSimulator = None


def get_feature_map(name: str = 'zz', num_qubits: int = 4, reps: int = 2, entanglement: str = 'linear') -> QuantumCircuit:
    """
    Constructs a parameterized quantum feature map in native Qiskit.
    Supports ZZFeatureMap (with entangling RZZ / CX gates), ZFeatureMap (independent RZ rotations),
    and PauliFeatureMap.
    """
    name = (name or 'zz').lower()
    entanglement = entanglement if entanglement in ['linear', 'full', 'circular'] else 'linear'
    num_qubits = max(2, min(6, int(num_qubits)))
    reps = max(1, min(3, int(reps)))

    if name in ['zz', 'zzfeaturemap']:
        return zz_feature_map(feature_dimension=num_qubits, reps=reps, entanglement=entanglement)
    elif name in ['z', 'zfeaturemap']:
        return z_feature_map(feature_dimension=num_qubits, reps=reps)
    elif name in ['pauli', 'paulifeaturemap']:
        return pauli_feature_map(feature_dimension=num_qubits, reps=reps, paulis=['Z', 'ZZ'], entanglement=entanglement)
    else:
        return zz_feature_map(feature_dimension=num_qubits, reps=reps, entanglement=entanglement)


def compute_statevectors(fmap: QuantumCircuit, X: np.ndarray) -> np.ndarray:
    """
    Computes exact statevectors |psi(x)> for each row in X using Qiskit Statevector.
    Returns complex array of shape (N, 2^n).
    """
    X = np.asarray(X, dtype=float)
    if X.ndim == 1:
        X = X.reshape(1, -1)
    
    n_samples, n_features = X.shape
    num_qubits = fmap.num_qubits

    if n_features != num_qubits:
        raise ValueError(f"Feature dimension ({n_features}) must match circuit qubits ({num_qubits}).")

    dim = 2 ** num_qubits
    statevectors = np.empty((n_samples, dim), dtype=np.complex128)

    for i in range(n_samples):
        # Assign parameters to feature map circuit
        bound_qc = fmap.assign_parameters(X[i])
        sv = Statevector.from_instruction(bound_qc)
        statevectors[i] = sv.data

    return statevectors


def compute_quantum_kernel_matrix(
    X1: np.ndarray,
    X2: Optional[np.ndarray] = None,
    fmap: Optional[QuantumCircuit] = None,
    mode: str = 'statevector',
    shots: int = 1024
) -> np.ndarray:
    """
    Computes the Fidelity Quantum Kernel Gram matrix K:
    K[i, j] = |<psi(x1_i) | psi(x2_j)>|^2
    
    If mode == 'statevector': Evaluates exact analytical state fidelity |<psi|phi>|^2.
    If mode == 'aer': Evaluates shot-based transition probability on Qiskit Aer simulator.
    """
    if fmap is None:
        fmap = get_feature_map('zz', num_qubits=4, reps=2, entanglement='linear')

    X1 = np.asarray(X1, dtype=float)
    is_symmetric = False
    if X2 is None:
        X2 = X1
        is_symmetric = True
    else:
        X2 = np.asarray(X2, dtype=float)

    n1 = len(X1)
    n2 = len(X2)

    if mode == 'aer' and AER_AVAILABLE:
        # Shot-based Aer simulation: construct transition circuits U(x1) U(x2)^\dagger
        sim = AerSimulator()
        kernel_matrix = np.zeros((n1, n2), dtype=float)

        for i in range(n1):
            start_j = i if is_symmetric else 0
            for j in range(start_j, n2):
                if is_symmetric and i == j:
                    kernel_matrix[i, j] = 1.0
                    continue

                qc1 = fmap.assign_parameters(X1[i])
                qc2 = fmap.assign_parameters(X2[j])
                
                # Invert qc2 to form overlap circuit
                overlap_qc = QuantumCircuit(fmap.num_qubits, fmap.num_qubits)
                overlap_qc.compose(qc1, inplace=True)
                overlap_qc.compose(qc2.inverse(), inplace=True)
                overlap_qc.measure(range(fmap.num_qubits), range(fmap.num_qubits))

                result = sim.run(overlap_qc, shots=shots).result()
                counts = result.get_counts()
                zero_state = '0' * fmap.num_qubits
                prob = counts.get(zero_state, 0) / shots
                kernel_matrix[i, j] = prob
                if is_symmetric:
                    kernel_matrix[j, i] = prob

        return np.clip(kernel_matrix, 0.0, 1.0)

    # Statevector exact calculation (Vectorized Gram matrix: |V1 @ V2.conj().T|^2)
    V1 = compute_statevectors(fmap, X1)
    if is_symmetric:
        inner_products = np.dot(V1, V1.conj().T)
        kernel_matrix = np.abs(inner_products) ** 2
        # Ensure exact unit diagonal
        np.fill_diagonal(kernel_matrix, 1.0)
    else:
        V2 = compute_statevectors(fmap, X2)
        inner_products = np.dot(V1, V2.conj().T)
        kernel_matrix = np.abs(inner_products) ** 2

    return np.clip(kernel_matrix, 0.0, 1.0)


def evaluate_fidelity_pair(
    x1: np.ndarray,
    x2: np.ndarray,
    fmap: Optional[QuantumCircuit] = None,
    mode: str = 'statevector',
    shots: int = 1024
) -> Dict[str, Any]:
    """
    Computes fidelity overlap and state details between two individual feature vectors.
    """
    if fmap is None:
        fmap = get_feature_map('zz', num_qubits=len(x1), reps=2, entanglement='linear')

    x1 = np.asarray(x1, dtype=float).flatten()
    x2 = np.asarray(x2, dtype=float).flatten()

    qc1 = fmap.assign_parameters(x1)
    qc2 = fmap.assign_parameters(x2)

    sv1 = Statevector.from_instruction(qc1)
    sv2 = Statevector.from_instruction(qc2)

    exact_overlap = float(np.abs(np.vdot(sv1.data, sv2.data)) ** 2)

    aer_overlap = None
    if AER_AVAILABLE and mode == 'aer':
        sim = AerSimulator()
        overlap_qc = QuantumCircuit(fmap.num_qubits, fmap.num_qubits)
        overlap_qc.compose(qc1, inplace=True)
        overlap_qc.compose(qc2.inverse(), inplace=True)
        overlap_qc.measure(range(fmap.num_qubits), range(fmap.num_qubits))

        res = sim.run(overlap_qc, shots=shots).result()
        counts = res.get_counts()
        aer_overlap = float(counts.get('0' * fmap.num_qubits, 0) / shots)

    # Probabilities for states
    basis_states = [format(k, f'0{fmap.num_qubits}b') for k in range(2 ** fmap.num_qubits)]
    probs1 = [round(float(p), 4) for p in sv1.probabilities()]
    probs2 = [round(float(p), 4) for p in sv2.probabilities()]

    return {
        "exact_fidelity": round(exact_overlap, 6),
        "aer_sampled_fidelity": round(aer_overlap, 6) if aer_overlap is not None else round(exact_overlap, 6),
        "qubits": fmap.num_qubits,
        "mode_used": mode if (mode == 'aer' and AER_AVAILABLE) else 'statevector',
        "basis_states": basis_states,
        "state1_probabilities": probs1,
        "state2_probabilities": probs2,
    }


def get_circuit_metadata(
    fmap: QuantumCircuit,
    sample_values: Optional[List[float]] = None
) -> Dict[str, Any]:
    """
    Extracts genuine circuit depth, gate counts, ASCII diagram, and gate sequence
    for front-end visualization and educational inspection.
    """
    dec_qc = fmap.decompose()

    if sample_values is not None:
        try:
            bound_qc = fmap.assign_parameters(sample_values).decompose()
            dec_qc = bound_qc
        except Exception:
            pass

    ops = dict(dec_qc.count_ops())
    depth = int(dec_qc.depth())
    num_qubits = int(fmap.num_qubits)

    # Count single-qubit vs two-qubit entangling gates
    two_qubit_gates = int(ops.get('cx', 0) + ops.get('rzz', 0) + ops.get('cz', 0) + ops.get('swap', 0))
    single_qubit_gates = sum(v for k, v in ops.items() if k not in ['cx', 'rzz', 'cz', 'swap', 'barrier'])

    # ASCII text drawing
    ascii_art = dec_qc.draw(output='text').single_string()

    # Extract clean gate sequence for frontend visual circuit builder
    gate_sequence = []
    for instruction in dec_qc.data:
        op = instruction.operation
        if op.name == 'barrier':
            continue
        qubit_indices = [dec_qc.find_bit(q).index for q in instruction.qubits]
        params_str = ", ".join([f"{p:.2f}" for p in op.params if isinstance(p, (int, float))])
        gate_sequence.append({
            "name": op.name.upper(),
            "qubits": qubit_indices,
            "params": params_str if params_str else None,
            "is_entangling": len(qubit_indices) > 1
        })

    return {
        "num_qubits": num_qubits,
        "depth": depth,
        "total_gates": int(sum(ops.values())),
        "single_qubit_gates": single_qubit_gates,
        "two_qubit_gates": two_qubit_gates,
        "operations": ops,
        "ascii_diagram": ascii_art,
        "gate_sequence": gate_sequence[:60]  # First 60 gates for clean UI rendering
    }


class QuantumKernelSVR(BaseEstimator, RegressorMixin):
    """
    Scikit-learn compatible Fidelity Quantum Kernel Support Vector Regressor.
    Utilizes Qiskit parameterized feature maps to build the Gram matrix K(X, Z).
    """
    def __init__(
        self,
        fmap_name: str = 'zz',
        num_qubits: int = 4,
        reps: int = 2,
        entanglement: str = 'linear',
        C: float = 10.0,
        epsilon: float = 0.1,
        mode: str = 'statevector'
    ):
        self.fmap_name = fmap_name
        self.num_qubits = num_qubits
        self.reps = reps
        self.entanglement = entanglement
        self.C = C
        self.epsilon = epsilon
        self.mode = mode

        self.fmap_ = None
        self.svr_ = None
        self.X_train_ = None

    def fit(self, X: np.ndarray, y: np.ndarray):
        X = np.asarray(X, dtype=float)
        y = np.asarray(y, dtype=float)

        self.fmap_ = get_feature_map(
            name=self.fmap_name,
            num_qubits=self.num_qubits,
            reps=self.reps,
            entanglement=self.entanglement
        )
        self.X_train_ = X.copy()

        # Compute quantum Gram matrix
        K_train = compute_quantum_kernel_matrix(X, fmap=self.fmap_, mode=self.mode)

        # Fit precomputed SVR
        self.svr_ = SVR(kernel='precomputed', C=self.C, epsilon=self.epsilon)
        self.svr_.fit(K_train, y)
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        if self.svr_ is None or self.X_train_ is None or self.fmap_ is None:
            raise RuntimeError("QuantumKernelSVR has not been fitted yet.")

        X = np.asarray(X, dtype=float)
        # Compute test vs train kernel matrix
        K_test = compute_quantum_kernel_matrix(X, self.X_train_, fmap=self.fmap_, mode=self.mode)
        return self.svr_.predict(K_test)
