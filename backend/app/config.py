import os

class Settings:
    PROJECT_NAME: str = "QuantumYield AI"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "quantumyield_production_secure_secret_key_2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    SQLITE_PATH: str = os.getenv("SQLITE_PATH", "quantumyield.db")
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()
