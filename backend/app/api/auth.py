import uuid
from datetime import datetime, timedelta
from typing import Optional

import jwt
import bcrypt
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import settings
from app.database import UserRepository
from app.schemas import UserRegister, UserLogin, Token, UserResponse

router = APIRouter()
security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided."
        )
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload.")
        user = UserRepository.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found.")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired. Please log in again.")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or malformed authentication token.")

def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id:
            return UserRepository.get_by_id(user_id)
    except Exception:
        pass
    return None

@router.post("/register", response_model=Token)
def register(user_in: UserRegister):
    existing = UserRepository.get_by_email(user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    new_user = {
        "id": str(uuid.uuid4()),
        "email": user_in.email.lower().strip(),
        "full_name": user_in.full_name.strip(),
        "hashed_password": hash_password(user_in.password),
        "created_at": datetime.utcnow().isoformat()
    }
    UserRepository.create(new_user)

    token = create_access_token({"sub": new_user["id"], "email": new_user["email"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user["id"],
            "email": new_user["email"],
            "full_name": new_user["full_name"],
            "created_at": new_user["created_at"]
        }
    }

@router.post("/login", response_model=Token)
def login(credentials: UserLogin):
    user = UserRepository.get_by_email(credentials.email)
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token({"sub": user["id"], "email": user["email"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "created_at": user["created_at"]
        }
    }

@router.post("/guest", response_model=Token)
def guest_login():
    """
    Provides seamless 1-click demo access for academic evaluators and capstone judges.
    """
    guest_email = "guest.researcher@quantumyield.ai"
    user = UserRepository.get_by_email(guest_email)
    if not user:
        user = {
            "id": "guest-researcher-001",
            "email": guest_email,
            "full_name": "Dr. Agri-Quantum Evaluator",
            "hashed_password": hash_password("demo_password_123"),
            "created_at": datetime.utcnow().isoformat()
        }
        UserRepository.create(user)

    token = create_access_token({"sub": user["id"], "email": user["email"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "created_at": user["created_at"]
        }
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "created_at": current_user["created_at"]
    }
