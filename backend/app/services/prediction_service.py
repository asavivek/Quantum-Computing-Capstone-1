import os
import time
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List

from app.services.agronomy import generate_agronomic_recommendations

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ml", "models")

class PredictionService:
    _models: Dict[str, Any] = {}
    _preprocessor = None
    _pca_q = None
    _scaler_q = None
    _benchmark: Dict[str, Any] = {}
    _residual_std: float = 0.85

    @classmethod
    def load_artifacts(cls):
        if cls._models:
            return

        try:
            cls._preprocessor = joblib.load(os.path.join(MODELS_DIR, 'preprocessor.joblib'))
            cls._pca_q = joblib.load(os.path.join(MODELS_DIR, 'pca_quantum.joblib'))
            cls._scaler_q = joblib.load(os.path.join(MODELS_DIR, 'scaler_quantum.joblib'))

            cls._models['dummy'] = joblib.load(os.path.join(MODELS_DIR, 'dummy_model.joblib'))
            cls._models['random_forest'] = joblib.load(os.path.join(MODELS_DIR, 'random_forest_model.joblib'))
            cls._models['hist_gb'] = joblib.load(os.path.join(MODELS_DIR, 'hist_gb_model.joblib'))
            cls._models['classical_svr'] = joblib.load(os.path.join(MODELS_DIR, 'classical_svr_model.joblib'))
            cls._models['quantum_svr'] = joblib.load(os.path.join(MODELS_DIR, 'quantum_svr_model.joblib'))

            benchmark_path = os.path.join(MODELS_DIR, 'model_benchmark.json')
            if os.path.exists(benchmark_path):
                with open(benchmark_path, 'r') as f:
                    cls._benchmark = json.load(f)
                    cls._residual_std = cls._benchmark.get('residual_std', 0.85)
            print("PredictionService: All classical and quantum models loaded successfully.")
        except Exception as e:
            print(f"PredictionService: Error loading models from {MODELS_DIR}: {e}")

    @classmethod
    def get_benchmark(cls) -> Dict[str, Any]:
        cls.load_artifacts()
        return cls._benchmark

    @classmethod
    def execute_prediction(cls, inputs: Dict[str, Any], selected_model: str = 'hist_gb') -> Dict[str, Any]:
        cls.load_artifacts()
        if not cls._models:
            raise RuntimeError("Models are not loaded or trained yet.")

        # Prepare single-row DataFrame
        df = pd.DataFrame([{
            'crop': inputs.get('crop', 'Wheat'),
            'region': inputs.get('region', 'Midwest Plains'),
            'season': inputs.get('season', 'Rabi/Winter'),
            'soil_type': inputs.get('soil_type', 'Loam'),
            'soil_ph': float(inputs.get('soil_ph', 6.5)),
            'soil_nitrogen': float(inputs.get('soil_nitrogen', 120.0)),
            'soil_phosphorus': float(inputs.get('soil_phosphorus', 50.0)),
            'soil_potassium': float(inputs.get('soil_potassium', 140.0)),
            'soil_organic_carbon': float(inputs.get('soil_organic_carbon', 1.4)),
            'temperature': float(inputs.get('temperature', 22.0)),
            'rainfall': float(inputs.get('rainfall', 450.0)),
            'humidity': float(inputs.get('humidity', 60.0)),
            'soil_moisture': float(inputs.get('soil_moisture', 35.0)),
            'area_hectares': float(inputs.get('area_hectares', 5.0))
        }])

        # Process with standard preprocessor
        X_proc = cls._preprocessor.transform(df)

        # Quantum transformed representation
        q_proc = cls._pca_q.transform(X_proc)
        q_scaled = cls._scaler_q.transform(q_proc)

        results_list: List[Dict[str, Any]] = []

        # 1. Dummy
        t0 = time.time()
        p_dummy = float(cls._models['dummy'].predict(X_proc)[0])
        lat_dummy = (time.time() - t0) * 1000
        bm_dummy = cls._benchmark.get('models', {}).get('dummy', {})
        results_list.append({
            'model_key': 'dummy',
            'model_name': 'Dummy Regressor (Baseline)',
            'model_type': 'Classical Baseline',
            'predicted_yield': round(max(0.1, p_dummy), 2),
            'mae': bm_dummy.get('mae', 2.64),
            'rmse': bm_dummy.get('rmse', 4.97),
            'r2': bm_dummy.get('r2', -0.0003),
            'latency_ms': round(lat_dummy, 3)
        })

        # 2. Random Forest
        t0 = time.time()
        p_rf = float(cls._models['random_forest'].predict(X_proc)[0])
        lat_rf = (time.time() - t0) * 1000
        bm_rf = cls._benchmark.get('models', {}).get('random_forest', {})
        results_list.append({
            'model_key': 'random_forest',
            'model_name': 'Random Forest Regressor',
            'model_type': 'Classical Ensemble',
            'predicted_yield': round(max(0.1, p_rf), 2),
            'mae': bm_rf.get('mae', 0.83),
            'rmse': bm_rf.get('rmse', 2.08),
            'r2': bm_rf.get('r2', 0.82),
            'latency_ms': round(lat_rf, 3)
        })

        # 3. HistGradientBoosting
        t0 = time.time()
        p_hgb = float(cls._models['hist_gb'].predict(X_proc)[0])
        lat_hgb = (time.time() - t0) * 1000
        bm_hgb = cls._benchmark.get('models', {}).get('hist_gb', {})
        results_list.append({
            'model_key': 'hist_gb',
            'model_name': 'HistGradientBoosting Regressor',
            'model_type': 'Classical Boosting',
            'predicted_yield': round(max(0.1, p_hgb), 2),
            'mae': bm_hgb.get('mae', 0.81),
            'rmse': bm_hgb.get('rmse', 1.81),
            'r2': bm_hgb.get('r2', 0.87),
            'latency_ms': round(lat_hgb, 3)
        })

        # 4. Classical SVR
        t0 = time.time()
        p_svr = float(cls._models['classical_svr'].predict(X_proc)[0])
        lat_svr = (time.time() - t0) * 1000
        bm_svr = cls._benchmark.get('models', {}).get('classical_svr', {})
        results_list.append({
            'model_key': 'classical_svr',
            'model_name': 'Classical Support Vector Regressor (RBF)',
            'model_type': 'Classical Kernel',
            'predicted_yield': round(max(0.1, p_svr), 2),
            'mae': bm_svr.get('mae', 1.15),
            'rmse': bm_svr.get('rmse', 2.40),
            'r2': bm_svr.get('r2', 0.77),
            'latency_ms': round(lat_svr, 3)
        })

        # 5. Quantum SVR
        t0 = time.time()
        p_q = float(cls._models['quantum_svr'].predict(q_scaled)[0])
        lat_q = (time.time() - t0) * 1000
        bm_q = cls._benchmark.get('models', {}).get('quantum_svr', {})
        results_list.append({
            'model_key': 'quantum_svr',
            'model_name': 'Quantum Fidelity-Kernel Regressor (Qiskit)',
            'model_type': 'Quantum Machine Learning',
            'predicted_yield': round(max(0.1, p_q), 2),
            'mae': bm_q.get('mae', 2.67),
            'rmse': bm_q.get('rmse', 5.66),
            'r2': bm_q.get('r2', -0.15),
            'latency_ms': round(lat_q, 3)
        })

        # Select target yield based on user choice
        selected_res = next((r for r in results_list if r['model_key'] == selected_model), results_list[2])
        primary_yield = selected_res['predicted_yield']

        # 90% Statistical Prediction Interval (1.645 * residual_std)
        delta_ci = 1.645 * cls._residual_std
        conf_lower = round(max(0.05, primary_yield - delta_ci), 2)
        conf_upper = round(primary_yield + delta_ci, 2)

        # Agronomic recommendations
        agronomy_data = generate_agronomic_recommendations(inputs, primary_yield)

        quantum_meta = {
            'qubits': 4,
            'feature_map': 'ZZFeatureMap',
            'reps': 2,
            'entanglement': 'linear',
            'state_encoding_angles': [round(float(v), 3) for v in q_scaled[0]],
            'simulator_engine': 'Qiskit Statevector / Aer Local Simulator',
            'quantum_inference_time_ms': round(lat_q, 3)
        }

        return {
            'selected_model': selected_res['model_key'],
            'predicted_yield': primary_yield,
            'confidence_lower': conf_lower,
            'confidence_upper': conf_upper,
            'unit': 'metric tons / hectare',
            'total_farm_yield_tons': agronomy_data['total_farm_yield_tons'],
            'model_results': results_list,
            'quantum_metadata': quantum_meta,
            'agronomic_insights': agronomy_data
        }
