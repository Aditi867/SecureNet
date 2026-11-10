
import pandas as pd
from pathlib import Path

from sklearn.preprocessing import (
    OneHotEncoder,
    StandardScaler,
    LabelEncoder
)
from sklearn.model_selection import train_test_split


# Dataset location
DATA_PATH = Path(__file__).parent / "data" / "UNSW-NB15_4.csv"


# Dataset column names
columns = [
    "srcip", "sport", "dstip", "dsport", "proto",
    "state", "dur", "sbytes", "dbytes", "sttl",
    "dttl", "sloss", "dloss", "service", "Sload",
    "Dload", "Spkts", "Dpkts", "swin", "dwin",
    "stcpb", "dtcpb", "smeansz", "dmeansz",
    "trans_depth", "res_bdy_len", "Sjit", "Djit",
    "Stime", "Ltime", "Sintpkt", "Dintpkt",
    "tcprtt", "synack", "ackdat", "is_sm_ips_ports",
    "ct_state_ttl", "ct_flw_http_mthd", "is_ftp_login",
    "ct_ftp_cmd", "ct_srv_src", "ct_srv_dst",
    "ct_dst_ltm", "ct_src_ltm", "ct_src_dport_ltm",
    "ct_dst_sport_ltm", "ct_dst_src_ltm",
    "attack_cat", "label"
]


# 1. Load dataset
def load_dataset():

    df = pd.read_csv(
        DATA_PATH,
        header=None,
        names=columns
    )

    return df


# 2. Convert destination ports
def convert_port(value):

    value = str(value).strip()

    if value.lower().startswith("0x"):
        return int(value, 16)

    return int(value)


# 3. Clean dataset
def clean_dataset(df):

    df["dsport"] = df["dsport"].apply(convert_port)

    df["attack_cat"] = df["attack_cat"].str.strip()
    df["attack_cat"] = df["attack_cat"].fillna("Benign")

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

    return df


# 4. Separate features and targets
def prepare_features(df):

    X = df.drop(
        columns=["srcip", "dstip", "attack_cat", "label"]
    )

    y_binary = df["label"]
    y_multi = df["attack_cat"]

    return X, y_binary, y_multi


# 5. Encode categorical input features
def encode_features(X_train, X_test):

    categorical_cols = ["proto", "state", "service"]

    encoder = OneHotEncoder(
        handle_unknown="ignore",
        sparse_output=False
    )

    train_encoded = encoder.fit_transform(
        X_train[categorical_cols]
    )

    test_encoded = encoder.transform(
        X_test[categorical_cols]
    )

    encoded_columns = encoder.get_feature_names_out(
        categorical_cols
    )

    train_encoded_df = pd.DataFrame(
        train_encoded,
        columns=encoded_columns,
        index=X_train.index
    )

    test_encoded_df = pd.DataFrame(
        test_encoded,
        columns=encoded_columns,
        index=X_test.index
    )

    X_train = X_train.drop(columns=categorical_cols)
    X_test = X_test.drop(columns=categorical_cols)

    X_train = pd.concat(
        [X_train, train_encoded_df], axis=1
    )

    X_test = pd.concat(
        [X_test, test_encoded_df], axis=1
    )

    return X_train, X_test, encoder


# 6. Scale input features
def scale_features(X_train, X_test):

    scaler = StandardScaler()

    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    X_train_scaled = pd.DataFrame(
        X_train_scaled,
        columns=X_train.columns,
        index=X_train.index
    )

    X_test_scaled = pd.DataFrame(
        X_test_scaled,
        columns=X_test.columns,
        index=X_test.index
    )

    return X_train_scaled, X_test_scaled, scaler


# 7. Encode multiclass target labels
def encode_target(y_train, y_test):

    label_encoder = LabelEncoder()

    y_train_encoded = label_encoder.fit_transform(y_train)

    y_test_encoded = label_encoder.transform(y_test)

    return y_train_encoded, y_test_encoded, label_encoder


# 8. Complete preprocessing pipeline
def preprocess_data():

    # Load and clean data
    df = load_dataset()
    df = clean_dataset(df)

    # Separate features and targets
    X, y_binary, y_multi = prepare_features(df)

    # Check consistency of binary and multiclass labels
    expected_binary = (y_multi != "Benign").astype(int)

    if not (
        y_binary.reset_index(drop=True)
        == expected_binary.reset_index(drop=True)
    ).all():
        raise ValueError(
            "Binary and multiclass labels do not match!"
        )

    # Split dataset before encoding and scaling
    (
        X_train, X_test,
        y_binary_train, y_binary_test,
        y_multi_train, y_multi_test
    ) = train_test_split(
        X,
        y_binary,
        y_multi,
        test_size=0.2,
        random_state=42,
        stratify=y_multi
    )

    # Encode categorical input features
    X_train, X_test, encoder = encode_features(
        X_train, X_test
    )

    # Scale input features
    X_train, X_test, scaler = scale_features(
        X_train, X_test
    )

    # Encode multiclass target labels
    y_multi_train, y_multi_test, label_encoder = encode_target(
        y_multi_train, y_multi_test
    )

    # Display results
    print("\nPreprocessing completed!")

    print("\nTraining feature shape:", X_train.shape)
    print("Testing feature shape:", X_test.shape)

    print("\nBinary training labels:")
    print(y_binary_train.value_counts())

    print("\nMulticlass label mapping:")

    for index, category in enumerate(label_encoder.classes_):
        print(category, ":", index)

    print("\nMissing values in training data:",
          X_train.isnull().sum().sum())

    print("Missing values in testing data:",
          X_test.isnull().sum().sum())

    # Return processed data and fitted preprocessing objects
    return (
        X_train,
        X_test,
        y_binary_train,
        y_binary_test,
        y_multi_train,
        y_multi_test,
        encoder,
        scaler,
        label_encoder
    )


# 9. Run preprocessing
if __name__ == "__main__":

    (
        X_train,
        X_test,
        y_binary_train,
        y_binary_test,
        y_multi_train,
        y_multi_test,
        encoder,
        scaler,
        label_encoder
    ) = preprocess_data()
