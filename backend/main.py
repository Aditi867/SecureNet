
import pandas as pd
import json

from pathlib import Path
from io import BytesIO

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .predict import predict_data


# ==================================================
# 1. LOAD SAVED EVALUATION METRICS
# ==================================================

MODEL_DIR = Path(__file__).parent / "saved_models"

# Binary metrics
with open(MODEL_DIR / "binary_metrics.json", "r") as file:
    binary_metrics = json.load(file)

# Multiclass metrics
with open(MODEL_DIR / "multiclass_metrics.json", "r") as file:
    multiclass_metrics = json.load(file)


# ==================================================
# 2. CREATE FASTAPI APPLICATION
# ==================================================

app = FastAPI(
    title="SecureNet API",
    description="Deep Learning-Based Network Intrusion Detection System",
    version="1.0.0"
)


# ==================================================
# 3. CONFIGURE CORS
# ==================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================================================
# 4. HOME ROUTE
# ==================================================

@app.get("/")
def home():

    return {
        "message": "SecureNet Backend is running!"
    }


# ==================================================
# 5. HEALTH CHECK
# ==================================================

@app.get("/health")
def health_check():

    return {
        "status": "healthy",
        "project": "SecureNet"
    }


# ==================================================
# 6. BINARY MODEL METRICS
# ==================================================

@app.get("/metrics")
def get_binary_metrics():

    return binary_metrics


# ==================================================
# 7. MULTICLASS MODEL METRICS
# ==================================================

@app.get("/multiclass-metrics")
def get_multiclass_metrics():

    return multiclass_metrics


# ==================================================
# 8. UPLOAD CSV AND DETECT NETWORK ATTACKS
# ==================================================

@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    if not file.filename.lower().endswith(".csv"):

        raise HTTPException(
            status_code=400,
            detail="Please upload a CSV file"
        )

    try:

        contents = await file.read()

        df = pd.read_csv(
            BytesIO(contents),
            header=None
        )

        results = predict_data(df)

        return results

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
