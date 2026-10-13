import os
import sys
import time
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder, MinMaxScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.decomposition import PCA
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.svm import SVR
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Ensure backend root is on sys.path
backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from app.quantum.kernel import QuantumKernelSVR, get_feature_map, compute_quantum_kernel_matrix


NUMERIC_FEATURES = [
    'soil_ph', 'soil_nitrogen', 'soil_phosphorus', 'soil_potassium',
    'soil_organic_carbon', 'temperature', 'rainfall', 'humidity',
    'soil_moisture', 'area_hectares'
]

CATEGORICAL_FEATURES = [
    'crop', 'region', 'season', 'soil_type'
]


def train_and_evaluate_all_models(
    data_path: str = None,
    output_dir: str = None,
    quantum_subset_size: int = 150,
    test_eval_size: int = 50
) -> Dict[str, Any]:
    """
    Trains and objectively benchmarks 5 regressors on the exact same dataset splits:
    1. DummyRegressor (Baseline)
    2. Random Forest Regressor
    3. HistGradientBoostingRegressor
    4. Support Vector Regression (Classical RBF)
    5. Quantum Kernel SVR (ZZFeatureMap Fidelity Kernel)
    """
    if data_path is None:
        data_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dataset.csv')
    if output_dir is None:
        output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')

    os.makedirs(output_dir, exist_ok=True)
    alt_models_dir = os.path.abspath(os.path.join(backend_root, '..', 'models'))
    os.makedirs(alt_models_dir, exist_ok=True)

    print(f"Loading dataset from: {data_path}")
    df = pd.read_csv(data_path)
    X = df.drop(columns=['yield'])
    y = df['yield'].values

    # Preprocessor
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), NUMERIC_FEATURES),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), CATEGORICAL_FEATURES)
        ]
    )

    # 80/20 train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print(f"Fitting preprocessor on training data ({len(X_train)} samples)...")
    X_train_proc = preprocessor.fit_transform(X_train)
    X_test_proc = preprocessor.transform(X_test)

    # Dictionary to collect results
    results = {}
    models_saved = {}

    # Common evaluation test set for parity comparison (test_eval_size samples)
    eval_idx = np.arange(min(len(X_test), test_eval_size))
    y_eval = y_test[eval_idx]
    X_eval_proc = X_test_proc[eval_idx]
    X_eval_raw = X_test.iloc[eval_idx]

    # --- 1. Baseline: DummyRegressor ---
    print("\n--- Training Model 1/5: DummyRegressor Baseline ---")
    t0 = time.time()
    dummy = DummyRegressor(strategy='mean')
    dummy.fit(X_train_proc, y_train)
    t_train_dummy = time.time() - t0

    t0 = time.time()
    y_pred_dummy = dummy.predict(X_test_proc)
    dummy_lat = ((time.time() - t0) / len(X_test_proc)) * 1000

    results['dummy'] = {
        'name': 'Dummy Regressor (Mean Baseline)',
        'type': 'Classical Baseline',
        'mae': round(float(mean_absolute_error(y_test, y_pred_dummy)), 4),
        'rmse': round(float(np.sqrt(mean_squared_error(y_test, y_pred_dummy))), 4),
        'r2': round(float(r2_score(y_test, y_pred_dummy)), 4),
        'train_time_sec': round(t_train_dummy, 4),
        'latency_per_sample_ms': round(dummy_lat, 4),
        'predictions_eval': [round(float(p), 2) for p in dummy.predict(X_eval_proc)]
    }
    models_saved['dummy'] = dummy

    # --- 2. Random Forest Regressor ---
    print("--- Training Model 2/5: Random Forest Regressor ---")
    t0 = time.time()
    rf = RandomForestRegressor(n_estimators=100, max_depth=14, random_state=42, n_jobs=-1)
    rf.fit(X_train_proc, y_train)
    t_train_rf = time.time() - t0

    t0 = time.time()
    y_pred_rf = rf.predict(X_test_proc)
    rf_lat = ((time.time() - t0) / len(X_test_proc)) * 1000

    results['random_forest'] = {
        'name': 'Random Forest Regressor',
        'type': 'Classical Ensemble',
        'mae': round(float(mean_absolute_error(y_test, y_pred_rf)), 4),
        'rmse': round(float(np.sqrt(mean_squared_error(y_test, y_pred_rf))), 4),
        'r2': round(float(r2_score(y_test, y_pred_rf)), 4),
        'train_time_sec': round(t_train_rf, 4),
        'latency_per_sample_ms': round(rf_lat, 4),
        'predictions_eval': [round(float(p), 2) for p in rf.predict(X_eval_proc)]
    }
    models_saved['random_forest'] = rf

    # --- 3. HistGradientBoostingRegressor ---
    print("--- Training Model 3/5: HistGradientBoostingRegressor ---")
    t0 = time.time()
    hgb = HistGradientBoostingRegressor(max_iter=150, random_state=42)
    hgb.fit(X_train_proc, y_train)
    t_train_hgb = time.time() - t0

    t0 = time.time()
    y_pred_hgb = hgb.predict(X_test_proc)
    hgb_lat = ((time.time() - t0) / len(X_test_proc)) * 1000

    results['hist_gb'] = {
        'name': 'HistGradientBoosting Regressor',
        'type': 'Classical Boosting',
        'mae': round(float(mean_absolute_error(y_test, y_pred_hgb)), 4),
        'rmse': round(float(np.sqrt(mean_squared_error(y_test, y_pred_hgb))), 4),
        'r2': round(float(r2_score(y_test, y_pred_hgb)), 4),
        'train_time_sec': round(t_train_hgb, 4),
        'latency_per_sample_ms': round(hgb_lat, 4),
        'predictions_eval': [round(float(p), 2) for p in hgb.predict(X_eval_proc)]
    }
    models_saved['hist_gb'] = hgb

    # --- 4. Classical Support Vector Regression (RBF) ---
    print("--- Training Model 4/5: Classical Support Vector Regressor (RBF) ---")
    t0 = time.time()
    svr = SVR(kernel='rbf', C=15.0, epsilon=0.2)
    svr.fit(X_train_proc, y_train)
    t_train_svr = time.time() - t0

    t0 = time.time()
    y_pred_svr = svr.predict(X_test_proc)
    svr_lat = ((time.time() - t0) / len(X_test_proc)) * 1000

    results['classical_svr'] = {
        'name': 'Classical Support Vector Regressor (RBF)',
        'type': 'Classical Kernel',
        'mae': round(float(mean_absolute_error(y_test, y_pred_svr)), 4),
        'rmse': round(float(np.sqrt(mean_squared_error(y_test, y_pred_svr))), 4),
        'r2': round(float(r2_score(y_test, y_pred_svr)), 4),
        'train_time_sec': round(t_train_svr, 4),
        'latency_per_sample_ms': round(svr_lat, 4),
        'predictions_eval': [round(float(p), 2) for p in svr.predict(X_eval_proc)]
    }
    models_saved['classical_svr'] = svr

    # --- 5. Quantum Fidelity-Kernel SVR (Qiskit ZZFeatureMap) ---
    print("\n--- Training Model 5/5: Quantum Fidelity-Kernel SVR (Qiskit Aer / Statevector) ---")
    # For quantum simulation on classical hardware, dimension is reduced to 4 qubits
    # and scaled into [0, pi] rotation angles.
    pca_q = PCA(n_components=4, random_state=42)
    scaler_q = MinMaxScaler(feature_range=(0.0, np.pi))

    q_train_proc = pca_q.fit_transform(X_train_proc)
    q_train_scaled = scaler_q.fit_transform(q_train_proc)

    q_test_proc = pca_q.transform(X_test_proc)
    q_test_scaled = scaler_q.transform(q_test_proc)

    # Use subset for quantum kernel training to maintain fast local simulation
    sub_n = min(len(q_train_scaled), quantum_subset_size)
    q_X_train_sub = q_train_scaled[:sub_n]
    q_y_train_sub = y_train[:sub_n]

    q_eval_scaled = q_test_scaled[eval_idx]

    t0 = time.time()
    q_model = QuantumKernelSVR(
        fmap_name='zz',
        num_qubits=4,
        reps=2,
        entanglement='linear',
        C=12.0,
        epsilon=0.2,
        mode='statevector'
    )
    q_model.fit(q_X_train_sub, q_y_train_sub)
    t_train_quantum = time.time() - t0

    t0 = time.time()
    y_pred_q_eval = q_model.predict(q_eval_scaled)
    q_lat = ((time.time() - t0) / len(q_eval_scaled)) * 1000

    results['quantum_svr'] = {
        'name': 'Quantum Fidelity-Kernel Regressor (Qiskit)',
        'type': 'Quantum Machine Learning',
        'mae': round(float(mean_absolute_error(y_eval, y_pred_q_eval)), 4),
        'rmse': round(float(np.sqrt(mean_squared_error(y_eval, y_pred_q_eval))), 4),
        'r2': round(float(r2_score(y_eval, y_pred_q_eval)), 4),
        'train_time_sec': round(t_train_quantum, 4),
        'latency_per_sample_ms': round(q_lat, 4),
        'predictions_eval': [round(float(p), 2) for p in y_pred_q_eval],
        'quantum_metadata': {
            'qubits': 4,
            'feature_map': 'ZZFeatureMap',
            'reps': 2,
            'entanglement': 'linear',
            'training_samples': sub_n,
            'evaluation_mode': 'Fidelity Statevector / Qiskit Aer',
            'hardware_scaling_note': 'O(N^2) pairwise quantum state fidelity evaluations on classical simulation'
        }
    }
    models_saved['quantum_svr'] = q_model

    # Residual standard deviations for uncertainty intervals (90% confidence = 1.645 * residual_std)
    residuals = y_test - y_pred_hgb
    residual_std = float(np.std(residuals))

    # Save artifacts
    print("\nPersisting models and evaluation metrics...")
    joblib.dump(preprocessor, os.path.join(output_dir, 'preprocessor.joblib'))
    joblib.dump(preprocessor, os.path.join(alt_models_dir, 'preprocessor.joblib'))

    joblib.dump(pca_q, os.path.join(output_dir, 'pca_quantum.joblib'))
    joblib.dump(scaler_q, os.path.join(output_dir, 'scaler_quantum.joblib'))
    joblib.dump(pca_q, os.path.join(alt_models_dir, 'pca_quantum.joblib'))
    joblib.dump(scaler_q, os.path.join(alt_models_dir, 'scaler_quantum.joblib'))

    for k, m in models_saved.items():
        joblib.dump(m, os.path.join(output_dir, f'{k}_model.joblib'))
        joblib.dump(m, os.path.join(alt_models_dir, f'{k}_model.joblib'))

    # Parity plot evaluation payload
    eval_parity_data = {
        'actual': [round(float(a), 2) for a in y_eval],
        'dummy': results['dummy']['predictions_eval'],
        'random_forest': results['random_forest']['predictions_eval'],
        'hist_gb': results['hist_gb']['predictions_eval'],
        'classical_svr': results['classical_svr']['predictions_eval'],
        'quantum_svr': results['quantum_svr']['predictions_eval'],
        'sample_crops': X_eval_raw['crop'].tolist(),
        'sample_regions': X_eval_raw['region'].tolist()
    }

    metadata = {
        'timestamp': time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        'dataset_total_samples': len(df),
        'train_samples': len(X_train),
        'test_samples': len(X_test),
        'quantum_train_samples': sub_n,
        'residual_std': round(residual_std, 4),
        'models': results,
        'parity_data': eval_parity_data,
        'features': {
            'numeric': NUMERIC_FEATURES,
            'categorical': CATEGORICAL_FEATURES
        }
    }

    metrics_path = os.path.join(output_dir, 'model_benchmark.json')
    with open(metrics_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    with open(os.path.join(alt_models_dir, 'model_benchmark.json'), 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"Benchmark summary written to {metrics_path}")
    print("\nSummary Results:")
    for k, res in results.items():
        print(f"  {res['name']}: R2={res['r2']}, MAE={res['mae']}, RMSE={res['rmse']}, Train={res['train_time_sec']}s, Latency={res['latency_per_sample_ms']}ms")

    return metadata

if __name__ == '__main__':
    train_and_evaluate_all_models()
