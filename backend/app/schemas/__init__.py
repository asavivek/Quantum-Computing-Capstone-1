from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any

# Authentication Schemas
class UserRegister(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=6, max_length=100)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    created_at: str

# Yield Prediction Schemas
class PredictionInput(BaseModel):
    crop: str = Field(default="Wheat", description="Target crop variety")
    region: str = Field(default="Midwest Plains", description="Geographic region")
    season: str = Field(default="Rabi/Winter", description="Growing season")
    soil_type: str = Field(default="Loam", description="Soil texture type")
    
    # Soil features
    soil_ph: float = Field(default=6.5, ge=4.0, le=9.0, description="Soil pH level (4.0 - 9.0)")
    soil_nitrogen: float = Field(default=120.0, ge=10.0, le=300.0, description="Available Nitrogen in kg/ha")
    soil_phosphorus: float = Field(default=50.0, ge=5.0, le=150.0, description="Available Phosphorus in kg/ha")
    soil_potassium: float = Field(default=140.0, ge=20.0, le=450.0, description="Available Potassium in kg/ha")
    soil_organic_carbon: float = Field(default=1.4, ge=0.1, le=5.0, description="Soil Organic Carbon %")
    soil_moisture: float = Field(default=35.0, ge=5.0, le=80.0, description="Soil Moisture %")
    
    # Weather features
    temperature: float = Field(default=22.0, ge=5.0, le=45.0, description="Average temperature in °C")
    rainfall: float = Field(default=450.0, ge=20.0, le=3000.0, description="Cumulative rainfall in mm")
    humidity: float = Field(default=60.0, ge=10.0, le=100.0, description="Relative humidity %")
    
    # Land area
    area_hectares: float = Field(default=5.0, ge=0.1, le=1000.0, description="Cultivated land area in hectares")
    
    # Model selection
    selected_model: Optional[str] = Field(
        default="hist_gb",
        description="Model to execute: hist_gb, random_forest, classical_svr, quantum_svr, dummy"
    )

class ModelResultItem(BaseModel):
    model_key: str
    model_name: str
    model_type: str
    predicted_yield: float
    mae: float
    rmse: float
    r2: float
    latency_ms: float

class PredictionOutput(BaseModel):
    id: str
    crop: str
    region: str
    season: str
    soil_type: str
    area_hectares: float
    inputs: Dict[str, Any]
    selected_model: str
    predicted_yield: float
    confidence_lower: float
    confidence_upper: float
    unit: str
    total_farm_yield_tons: Optional[float] = None
    model_results: List[ModelResultItem]
    quantum_metadata: Optional[Dict[str, Any]] = None
    agronomic_insights: Optional[Dict[str, Any]] = None
    created_at: str

# Quantum Lab Schemas
class QuantumCircuitRequest(BaseModel):
    fmap_name: str = Field(default="zz", description="zz, z, or pauli")
    num_qubits: int = Field(default=4, ge=2, le=6)
    reps: int = Field(default=2, ge=1, le=3)
    entanglement: str = Field(default="linear", description="linear, full, or circular")
    sample_values: Optional[List[float]] = None

class QuantumKernelMatrixRequest(BaseModel):
    fmap_name: str = Field(default="zz")
    num_qubits: int = Field(default=4, ge=2, le=6)
    reps: int = Field(default=2, ge=1, le=3)
    entanglement: str = Field(default="linear")
    mode: str = Field(default="statevector", description="statevector or aer")
    shots: int = Field(default=1024, ge=128, le=4096)
    sample_count: int = Field(default=8, ge=3, le=20, description="Number of agricultural data points to include in matrix")

class QuantumPairSimulationRequest(BaseModel):
    fmap_name: str = Field(default="zz")
    num_qubits: int = Field(default=4, ge=2, le=4)
    reps: int = Field(default=2, ge=1, le=3)
    entanglement: str = Field(default="linear")
    x1: List[float] = Field(..., min_length=2, max_length=6)
    x2: List[float] = Field(..., min_length=2, max_length=6)
    mode: str = Field(default="statevector")
    shots: int = Field(default=1024)
