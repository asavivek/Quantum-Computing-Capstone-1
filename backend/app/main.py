import sys
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import qiskit

from app.config import settings
from app.api import auth, predictions, quantum, models, agronomy
from app.database import get_connection, PredictionRepository
from app.services.prediction_service import PredictionService
from app.quantum.kernel import AER_AVAILABLE

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing QuantumYield AI backend...")
    try:
        PredictionService.load_artifacts()
    except Exception as e:
        print(f"Startup artifact loading note: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Quantum AI-Based Crop Yield Prediction & Smart Farming Platform API",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["Yield Predictions"])
app.include_router(quantum.router, prefix="/api/quantum", tags=["Quantum Laboratory"])
app.include_router(models.router, prefix="/api/models", tags=["Model Benchmark"])
app.include_router(agronomy.router, prefix="/api/agronomy", tags=["Agronomic Insights"])

@app.get("/api/health")
def health_check():
    """
    Comprehensive system health check verifying database, Qiskit quantum simulator,
    and trained model availability.
    """
    PredictionService.load_artifacts()

    # Check DB
    db_ok = False
    try:
        conn = get_connection()
        conn.execute("SELECT 1")
        conn.close()
        db_ok = True
    except Exception:
        pass

    # Check models
    models_ready = bool(PredictionService._models)

    return {
        "status": "healthy" if (db_ok and models_ready) else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "python_version": sys.version.split()[0],
        "qiskit_version": qiskit.__version__,
        "qiskit_aer_available": AER_AVAILABLE,
        "database_connected": db_ok,
        "database_type": "SQLite (Persistent)",
        "models_loaded": models_ready,
        "total_persisted_predictions": PredictionRepository.get_count()
    }
