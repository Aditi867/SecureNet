import torch
import pandas as pd
import joblib

from pathlib import Path
from .model import BinaryClassifier, MultiClassClassifier
# Folder containing saved models
MODEL_DIR = Path(__file__).parent / "saved_models"
# Load binary classification model
binary_model = BinaryClassifier(input_size=202)

binary_model.load_state_dict(
    torch.load(
        MODEL_DIR / "binary_model.pth",
        map_location="cpu",
        weights_only=True
    )
)

binary_model.eval()


# Load multiclass classification model
multi_model = MultiClassClassifier(
    input_size=202,
    num_classes=10
)

multi_model.load_state_dict(
    torch.load(
        MODEL_DIR / "multiclass_model.pth",
        map_location="cpu",
        weights_only=True
    )
)

multi_model.eval()
# Load preprocessing objects
encoder = joblib.load(
    MODEL_DIR / "encoder.pkl"
)

scaler = joblib.load(
    MODEL_DIR / "scaler.pkl"
)

label_encoder = joblib.load(
    MODEL_DIR / "label_encoder.pkl"
)

print("SecureNet models and preprocessing objects loaded!")
# Prepare uploaded data for prediction
def prepare_input(df):

    # Assign dataset column names if CSV has no headers
    from .preprocess import columns, convert_port

    if len(df.columns) == 49:
        df.columns = columns

    # Clean destination port
    df["dsport"] = df["dsport"].apply(convert_port)

    # Fill missing values
    df["is_ftp_login"] = df["is_ftp_login"].fillna(0)
    df["ct_flw_http_mthd"] = df["ct_flw_http_mthd"].fillna(0)

    df["ct_ftp_cmd"] = (
        pd.to_numeric(
            df["ct_ftp_cmd"].astype(str).str.strip(),
            errors="coerce"
        )
        .fillna(0)
        .astype(int)
    )

    # Remove columns not used as model inputs
    X = df.drop(
        columns=[
            "srcip",
            "dstip",
            "attack_cat",
            "label"
        ],
        errors="ignore"
    )

    # Encode categorical columns
    categorical_cols = ["proto", "state", "service"]

    encoded = encoder.transform(
        X[categorical_cols]
    )

    encoded_df = pd.DataFrame(
        encoded,
        columns=encoder.get_feature_names_out(categorical_cols),
        index=X.index
    )

    X = X.drop(columns=categorical_cols)

    X = pd.concat([X, encoded_df], axis=1)

    # Scale features
    X = scaler.transform(X)

    return torch.tensor(
        X,
        dtype=torch.float32
    )
# Make predictions on uploaded network data

# Make predictions on uploaded network data
def predict_data(df):

    input_tensor = prepare_input(df)

    with torch.no_grad():

        # Binary predictions
        binary_outputs = binary_model(input_tensor)

        binary_predictions = (
            torch.sigmoid(binary_outputs) >= 0.5
        ).int().numpy().flatten()

        # Multiclass predictions
        multi_outputs = multi_model(input_tensor)

        multi_predictions = torch.argmax(
            multi_outputs,
            dim=1
        ).numpy()

    # Convert numeric predictions into attack names
    attack_names = label_encoder.inverse_transform(
        multi_predictions
    )

    # Count benign and attack records
    attack_count = int((binary_predictions == 1).sum())
    benign_count = int((binary_predictions == 0).sum())

    # Count each predicted attack category
    category_counts = pd.Series(
        attack_names
    ).value_counts().to_dict()

    return {
        "total_records": len(df),
        "attack_count": attack_count,
        "benign_count": benign_count,
        "attack_categories": category_counts
    }
