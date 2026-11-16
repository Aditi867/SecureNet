
import pandas as pd
import json
import csv
from .live_explain import explain_live_flow
from .live_history import get_history, get_all_history
from pathlib import Path
from io import BytesIO, StringIO

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .predict import predict_data
from .live_controller import live_controller


# ==================================================
# 1. LOAD SAVED EVALUATION METRICS
# ==================================================

MODEL_DIR = Path(__file__).parent / "saved_models"


with open(MODEL_DIR / "binary_metrics.json", "r") as file:
    binary_metrics = json.load(file)

with open(MODEL_DIR / "multiclass_metrics.json", "r") as file:
    multiclass_metrics = json.load(file)

with open(MODEL_DIR / "ml_binary_metrics.json", "r") as file:
    ml_binary_metrics = json.load(file)

with open(MODEL_DIR / "ml_multiclass_metrics.json", "r") as file:
    ml_multiclass_metrics = json.load(file)


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
# 8. ML VS DL COMPARISON METRICS
# ==================================================

@app.get("/comparison-metrics")
def get_comparison_metrics():
    return {
        "binary": {
            "deep_learning": binary_metrics,
            "machine_learning": ml_binary_metrics
        },
        "multiclass": {
            "deep_learning": multiclass_metrics,
            "machine_learning": ml_multiclass_metrics
        }
    }


# ==================================================
# 9. UPLOAD CSV AND DETECT NETWORK ATTACKS
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


# ==================================================
# 10. START LIVE NETWORK MONITORING
# ==================================================

@app.post("/live/start")
def start_live_monitoring():

    try:
        started = live_controller.start()

        if not started:
            raise HTTPException(
                status_code=409,
                detail="Live monitoring is already running"
            )

        return {
            "message": "Live monitoring started",
            "running": True
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==================================================
# 11. STOP LIVE NETWORK MONITORING
# ==================================================

@app.post("/live/stop")
def stop_live_monitoring():

    try:
        stopped = live_controller.stop()

        return {
            "message": (
                "Live monitoring stopped"
                if stopped
                else "Live monitoring is not running"
            ),
            "running": False
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==================================================
# 12. GET LIVE MONITORING STATUS
# ==================================================

@app.get("/live/status")
def get_live_status():
    return live_controller.status()


# ==================================================
# 13. EXPLAIN LIVE NETWORK FLOW (XAI)
# ==================================================

@app.post("/live/explain")
def explain_network_flow(flow: dict):

    try:
        result = explain_live_flow(flow)

        return {
            "message": "SHAP explanation generated successfully",
            **result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==================================================
# 14. GET DETECTION HISTORY
# ==================================================

@app.get("/live/history")
def detection_history(limit: int = 500):

    if limit < 1 or limit > 10000:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 10000"
        )

    records = get_history(limit)

    return {
        "total": len(records),
        "records": records
    }


# ==================================================
# 15. DETECTION HISTORY STATISTICS
# ==================================================

@app.get("/live/history/stats")
def detection_history_stats():

    records = get_all_history()

    normal = sum(
        1 for r in records
        if r.get("classification") == "Normal"
    )

    malicious = sum(
        1 for r in records
        if r.get("classification") == "Malicious"
    )

    errors = sum(
        1 for r in records
        if r.get("classification") == "Error"
    )

    return {
        "total": len(records),
        "normal": normal,
        "malicious": malicious,
        "errors": errors
    }


# ==================================================
# 16. EXPORT DETECTION HISTORY AS CSV
# ==================================================

@app.get("/live/history/export")
def export_detection_history():

    records = get_all_history()

    if not records:
        raise HTTPException(
            status_code=404,
            detail="No detection history available to export"
        )

    output = StringIO()

    fieldnames = [
        "history_id",
        "captured_at",
        "src_ip",
        "dst_ip",
        "src_port",
        "dst_port",
        "protocol",
        "application",
        "classification",
        "risk_level",
        "malicious_probability",
        "confidence",
        "packets",
        "bytes",
        "duration_ms",
        "src_to_dst_packets",
        "dst_to_src_packets",
        "src_to_dst_bytes",
        "dst_to_src_bytes"
    ]

    writer = csv.DictWriter(
        output,
        fieldnames=fieldnames,
        extrasaction="ignore"
    )

    writer.writeheader()
    writer.writerows(records)

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition":
                "attachment; filename=SecureNet_Detection_History.csv"
        }
    )
