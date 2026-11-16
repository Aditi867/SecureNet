
import joblib
import pandas as pd
import shap
from pathlib import Path

BASE_DIR = Path(__file__).parent
MODEL_PATH = BASE_DIR / "saved_models" / "live_rf_model_v2.pkl"

model = joblib.load(MODEL_PATH)

FEATURES = [
    "sport", "dsport", "proto_id", "dur",
    "sbytes", "dbytes", "Spkts", "Dpkts",
    "smeansz", "dmeansz"
]

explainer = shap.TreeExplainer(model)


def explain_live_flow(flow, top_n=5):
    protocol = int(flow["protocol"])

    known_protocols = {1, 2, 6, 17, 41, 47, 89, 132}
    if protocol not in known_protocols:
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

    shap_values = explainer.shap_values(X)

    # Select the SHAP values for the Malicious class (class 1)
    if isinstance(shap_values, list):
        values = shap_values[1][0]
    else:
        values = shap_values[0, :, 1]

    contributions = pd.DataFrame({
        "feature": FEATURES,
        "value": X.iloc[0].values,
        "impact": values
    })

    contributions["direction"] = contributions["impact"].apply(
        lambda x: "Increases malicious prediction"
        if x > 0 else "Decreases malicious prediction"
    )

    contributions["impact"] = contributions["impact"].round(5)

    contributions = contributions.reindex(
        contributions["impact"].abs().sort_values(
            ascending=False
        ).index
    )

    return {
        "explanation": contributions.head(top_n).to_dict(
            orient="records"
        )
    }
