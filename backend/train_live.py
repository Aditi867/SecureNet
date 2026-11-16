
import json
import joblib
import numpy as np
import pandas as pd

from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)

# Paths
BASE_DIR = Path(__file__).parent
DATA_PATH = BASE_DIR / "data" / "UNSW-NB15_4.csv"
MODEL_DIR = BASE_DIR / "saved_models"
MODEL_DIR.mkdir(exist_ok=True)

# Shared live-compatible features
FEATURES = [
    "sport", "dsport", "proto_id", "dur",
    "sbytes", "dbytes", "Spkts", "Dpkts",
    "smeansz", "dmeansz"
]

# Common IP protocol IDs
PROTOCOL_MAP = {
    "tcp": 6,
    "udp": 17,
    "icmp": 1,
    "igmp": 2,
    "gre": 47,
    "ospf": 89,
    "sctp": 132,
    "ipv6": 41
}


def convert_port(value):
    try:
        value = str(value).strip()
        if value.lower().startswith("0x"):
            return int(value, 16)
        return float(value)
    except (ValueError, TypeError):
        return np.nan


print("Loading dataset...")

columns = {
    1: "sport",
    3: "dsport",
    4: "proto",
    6: "dur",
    7: "sbytes",
    8: "dbytes",
    16: "Spkts",
    17: "Dpkts",
    22: "smeansz",
    23: "dmeansz",
    48: "label"
}

df = pd.read_csv(
    DATA_PATH,
    header=None,
    usecols=list(columns.keys())
)

df.columns = list(columns.values())

print("Dataset loaded:", len(df), "records")

# Convert ports
df["sport"] = df["sport"].apply(convert_port)
df["dsport"] = df["dsport"].apply(convert_port)

# Convert protocol names to IP protocol numbers
df["proto"] = df["proto"].astype(str).str.strip().str.lower()
df["proto_id"] = df["proto"].map(PROTOCOL_MAP).fillna(-1)

# Convert remaining features to numeric
for col in FEATURES:
    df[col] = pd.to_numeric(df[col], errors="coerce")

df["label"] = pd.to_numeric(df["label"], errors="coerce")

# Clean invalid records
df = df.replace([np.inf, -np.inf], np.nan)
df = df.dropna(subset=FEATURES + ["label"])

X = df[FEATURES]
y = df["label"].astype(int)

print("Clean records:", len(df))
print("Label distribution:")
print(y.value_counts())

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("\nTraining live-compatible classifier...")

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=20,
    min_samples_leaf=2,
    class_weight="balanced_subsample",
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)

predictions = model.predict(X_test)

metrics = {
    "accuracy": float(accuracy_score(y_test, predictions)),
    "precision": float(precision_score(
        y_test, predictions, zero_division=0
    )),
    "recall": float(recall_score(
        y_test, predictions, zero_division=0
    )),
    "f1_score": float(f1_score(
        y_test, predictions, zero_division=0
    )),
    "confusion_matrix": confusion_matrix(
        y_test, predictions
    ).tolist(),
    "classification_report": classification_report(
        y_test, predictions, zero_division=0
    )
}

# Save separate live model and metadata
joblib.dump(model, MODEL_DIR / "live_rf_model.pkl")

with open(MODEL_DIR / "live_feature_columns.json", "w") as f:
    json.dump(FEATURES, f, indent=4)

with open(MODEL_DIR / "live_rf_metrics.json", "w") as f:
    json.dump(metrics, f, indent=4)

print("\n========== LIVE MODEL RESULTS ==========")
print("Accuracy:", round(metrics["accuracy"] * 100, 2), "%")
print("Precision:", round(metrics["precision"] * 100, 2), "%")
print("Recall:", round(metrics["recall"] * 100, 2), "%")
print("F1 Score:", round(metrics["f1_score"] * 100, 2), "%")
print("\nConfusion Matrix:")
print(metrics["confusion_matrix"])

print("\nClassification Report:")
print(metrics["classification_report"])

print("\nLive model saved successfully!")
