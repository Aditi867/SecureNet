
import json
import joblib
import numpy as np
import pandas as pd

from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, confusion_matrix, classification_report
)

BASE_DIR = Path(__file__).parent
DATA_PATH = BASE_DIR / "data" / "UNSW-NB15_4.csv"
BENIGN_PATH = BASE_DIR / "data" / "live_benign.csv"
MODEL_DIR = BASE_DIR / "saved_models"

FEATURES = [
    "sport", "dsport", "proto_id", "dur",
    "sbytes", "dbytes", "Spkts", "Dpkts",
    "smeansz", "dmeansz"
]

PROTOCOL_MAP = {
    "tcp": 6, "udp": 17, "icmp": 1, "igmp": 2,
    "gre": 47, "ospf": 89, "sctp": 132, "ipv6": 41
}

def convert_port(value):
    try:
        value = str(value).strip()
        return int(value, 16) if value.lower().startswith("0x") else float(value)
    except (ValueError, TypeError):
        return np.nan

print("Loading original UNSW dataset...")

columns = {
    1: "sport", 3: "dsport", 4: "proto",
    6: "dur", 7: "sbytes", 8: "dbytes",
    16: "Spkts", 17: "Dpkts",
    22: "smeansz", 23: "dmeansz", 48: "label"
}

df = pd.read_csv(DATA_PATH, header=None, usecols=list(columns))
df.columns = list(columns.values())

df["sport"] = df["sport"].apply(convert_port)
df["dsport"] = df["dsport"].apply(convert_port)
df["proto"] = df["proto"].astype(str).str.strip().str.lower()
df["proto_id"] = df["proto"].map(PROTOCOL_MAP).fillna(-1)

for col in FEATURES:
    df[col] = pd.to_numeric(df[col], errors="coerce")

df["label"] = pd.to_numeric(df["label"], errors="coerce")
df = df.replace([np.inf, -np.inf], np.nan)
df = df.dropna(subset=FEATURES + ["label"])

X_original = df[FEATURES]
y_original = df["label"].astype(int)

# Keep a separate original UNSW test set.
X_train, X_test, y_train, y_test = train_test_split(
    X_original, y_original,
    test_size=0.20,
    random_state=42,
    stratify=y_original
)

print("Loading presumed-benign live calibration data...")

live = pd.read_csv(BENIGN_PATH)
X_live = live[FEATURES].apply(pd.to_numeric, errors="coerce")
X_live = X_live.replace([np.inf, -np.inf], np.nan).dropna()

# Add live benign data only to the training partition.
X_combined = pd.concat([X_train, X_live], ignore_index=True)
y_combined = pd.concat([
    y_train.reset_index(drop=True),
    pd.Series(np.zeros(len(X_live), dtype=int))
], ignore_index=True)

print("Original training records:", len(X_train))
print("Added live benign records:", len(X_live))
print("Combined training records:", len(X_combined))

print("Training experimental model...")

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=20,
    min_samples_leaf=2,
    class_weight="balanced_subsample",
    random_state=42,
    n_jobs=-1
)

model.fit(X_combined, y_combined)

# Evaluate on untouched original UNSW test data.
pred = model.predict(X_test)

metrics = {
    "accuracy": float(accuracy_score(y_test, pred)),
    "precision": float(precision_score(y_test, pred, zero_division=0)),
    "recall": float(recall_score(y_test, pred, zero_division=0)),
    "f1_score": float(f1_score(y_test, pred, zero_division=0)),
    "confusion_matrix": confusion_matrix(y_test, pred).tolist(),
    "classification_report": classification_report(
        y_test, pred, zero_division=0
    )
}

MODEL_DIR.mkdir(exist_ok=True)

joblib.dump(model, MODEL_DIR / "live_rf_model_v2.pkl")

with open(MODEL_DIR / "live_rf_metrics_v2.json", "w") as f:
    json.dump(metrics, f, indent=4)

print("\n===== EXPERIMENTAL MODEL RESULTS =====")
print("Accuracy:", round(metrics["accuracy"] * 100, 2), "%")
print("Precision:", round(metrics["precision"] * 100, 2), "%")
print("Recall:", round(metrics["recall"] * 100, 2), "%")
print("F1:", round(metrics["f1_score"] * 100, 2), "%")
print("Confusion matrix:", metrics["confusion_matrix"])
print("\nSaved as live_rf_model_v2.pkl")
