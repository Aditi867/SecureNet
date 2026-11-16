
import joblib
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).parent
MODEL_PATH = BASE_DIR / "saved_models" / "live_rf_model_v2.pkl"

# Load experimental V2 model
model = joblib.load(MODEL_PATH)

FEATURES = [
    "sport", "dsport", "proto_id", "dur",
    "sbytes", "dbytes", "Spkts", "Dpkts",
    "smeansz", "dmeansz"
]

KNOWN_PROTOCOLS = {1, 2, 6, 17, 41, 47, 89, 132}


def predict_live_flow(flow):

    protocol = int(flow["protocol"])

    if protocol not in KNOWN_PROTOCOLS:
        protocol = -1

    features = {
        "sport": flow["src_port"],
        "dsport": flow["dst_port"],
        "proto_id": protocol,
        "dur": flow["duration_ms"] / 1000,
        "sbytes": flow["src_to_dst_bytes"],
        "dbytes": flow["dst_to_src_bytes"],
        "Spkts": flow["src_to_dst_packets"],
        "Dpkts": flow["dst_to_src_packets"],
        "smeansz": flow["src_to_dst_mean_packet_size"],
        "dmeansz": flow["dst_to_src_mean_packet_size"]
    }

    X = pd.DataFrame([features], columns=FEATURES)

    prediction = int(model.predict(X)[0])
    probabilities = model.predict_proba(X)[0]

    malicious_index = list(model.classes_).index(1)
    malicious_probability = float(probabilities[malicious_index])

    confidence = float(
        probabilities[list(model.classes_).index(prediction)]
    )

    if malicious_probability >= 0.90:
        risk_level = "High"
    elif malicious_probability >= 0.50:
        risk_level = "Review"
    else:
        risk_level = "Low"

    return {
        "prediction": prediction,
        "classification": "Malicious" if prediction == 1 else "Normal",
        "confidence": round(confidence * 100, 2),
        "malicious_probability": round(malicious_probability * 100, 2),
        "risk_level": risk_level
    }
