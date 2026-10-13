@echo off
echo ========================================================
echo   QuantumYield AI - Starting Local FastAPI Backend Server
echo   Native Qiskit 2.x & Scikit-Learn Model Simulator
echo ========================================================
cd /d "%~dp0backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
