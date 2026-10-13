import os
import sqlite3
import json
from typing import Dict, Any, List, Optional
from datetime import datetime

DB_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "quantumyield.db")

def get_connection():
    conn = sqlite3.connect(DB_FILE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        hashed_password TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    # Predictions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS predictions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        crop TEXT NOT NULL,
        region TEXT NOT NULL,
        season TEXT,
        soil_type TEXT,
        area_hectares REAL,
        inputs_json TEXT NOT NULL,
        selected_model TEXT NOT NULL,
        predicted_yield REAL NOT NULL,
        confidence_lower REAL NOT NULL,
        confidence_upper REAL NOT NULL,
        unit TEXT NOT NULL,
        total_farm_yield_tons REAL,
        model_results_json TEXT NOT NULL,
        quantum_metadata_json TEXT,
        agronomic_insights_json TEXT,
        created_at TEXT NOT NULL
    );
    """)
    conn.commit()
    conn.close()

# Auto-initialize database on import
init_db()

# User Repository
class UserRepository:
    @staticmethod
    def create(user_data: Dict[str, Any]) -> Dict[str, Any]:
        conn = get_connection()
        cursor = conn.cursor()
        created_at = user_data.get('created_at') or datetime.utcnow().isoformat()
        cursor.execute(
            "INSERT INTO users (id, email, full_name, hashed_password, created_at) VALUES (?, ?, ?, ?, ?)",
            (
                user_data['id'],
                user_data['email'].lower().strip(),
                user_data['full_name'],
                user_data['hashed_password'],
                created_at
            )
        )
        conn.commit()
        conn.close()
        return user_data

    @staticmethod
    def get_by_email(email: str) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email.lower().strip(),))
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
        return None

    @staticmethod
    def get_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
        return None

# Prediction Repository
class PredictionRepository:
    @staticmethod
    def create(pred: Dict[str, Any]) -> Dict[str, Any]:
        conn = get_connection()
        cursor = conn.cursor()
        created_at = pred.get('created_at') or datetime.utcnow().isoformat()
        area = float(pred.get('area_hectares', 1.0))
        predicted_yield = float(pred['predicted_yield'])
        total_tons = float(pred.get('total_farm_yield_tons') or round(predicted_yield * area, 2))

        cursor.execute(
            """
            INSERT INTO predictions (
                id, user_id, crop, region, season, soil_type, area_hectares,
                inputs_json, selected_model, predicted_yield, confidence_lower,
                confidence_upper, unit, total_farm_yield_tons, model_results_json,
                quantum_metadata_json, agronomic_insights_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                pred['id'],
                pred.get('user_id', 'anonymous'),
                pred['crop'],
                pred['region'],
                pred.get('season', 'Kharif/Monsoon'),
                pred.get('soil_type', 'Loam'),
                area,
                json.dumps(pred.get('inputs', {})),
                pred['selected_model'],
                predicted_yield,
                float(pred.get('confidence_lower', predicted_yield * 0.85)),
                float(pred.get('confidence_upper', predicted_yield * 1.15)),
                pred.get('unit', 'tons/ha'),
                total_tons,
                json.dumps(pred.get('model_results', [])),
                json.dumps(pred.get('quantum_metadata', {})),
                json.dumps(pred.get('agronomic_insights', {})),
                created_at
            )
        )
        conn.commit()
        conn.close()
        pred['total_farm_yield_tons'] = total_tons
        return pred

    @staticmethod
    def list_all(user_id: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
        conn = get_connection()
        cursor = conn.cursor()
        if user_id:
            cursor.execute(
                "SELECT * FROM predictions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
                (user_id, limit)
            )
        else:
            cursor.execute(
                "SELECT * FROM predictions ORDER BY created_at DESC LIMIT ?",
                (limit,)
            )
        rows = cursor.fetchall()
        conn.close()
        
        results = []
        for r in rows:
            d = dict(r)
            d['inputs'] = json.loads(d.pop('inputs_json', '{}'))
            d['model_results'] = json.loads(d.pop('model_results_json', '[]'))
            d['quantum_metadata'] = json.loads(d.pop('quantum_metadata_json', '{}'))
            d['agronomic_insights'] = json.loads(d.pop('agronomic_insights_json', '{}'))
            if d.get('total_farm_yield_tons') is None:
                d['total_farm_yield_tons'] = round(d['predicted_yield'] * d.get('area_hectares', 1.0), 2)
            results.append(d)
        return results

    @staticmethod
    def get_by_id(pred_id: str) -> Optional[Dict[str, Any]]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM predictions WHERE id = ?", (pred_id,))
        row = cursor.fetchone()
        conn.close()
        if not row:
            return None
        d = dict(row)
        d['inputs'] = json.loads(d.pop('inputs_json', '{}'))
        d['model_results'] = json.loads(d.pop('model_results_json', '[]'))
        d['quantum_metadata'] = json.loads(d.pop('quantum_metadata_json', '{}'))
        d['agronomic_insights'] = json.loads(d.pop('agronomic_insights_json', '{}'))
        if d.get('total_farm_yield_tons') is None:
            d['total_farm_yield_tons'] = round(d['predicted_yield'] * d.get('area_hectares', 1.0), 2)
        return d

    @staticmethod
    def delete(pred_id: str, user_id: Optional[str] = None) -> bool:
        conn = get_connection()
        cursor = conn.cursor()
        if user_id:
            cursor.execute("DELETE FROM predictions WHERE id = ? AND user_id = ?", (pred_id, user_id))
        else:
            cursor.execute("DELETE FROM predictions WHERE id = ?", (pred_id,))
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return deleted

    @staticmethod
    def get_count() -> int:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM predictions")
        count = cursor.fetchone()[0]
        conn.close()
        return count
