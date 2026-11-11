
import json
import time
import joblib

from pathlib import Path
from preprocess import preprocess_data

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
MODEL_DIR = Path(__file__).parent / "saved_models"
MODEL_DIR.mkdir(exist_ok=True)


# ==================================================
# 1. LOAD THE SAME PREPROCESSED DATASET
# ==================================================

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


# ==================================================
# 2. BINARY RANDOM FOREST MODEL
# ==================================================

print("\n========== BINARY RANDOM FOREST ==========")

binary_model = RandomForestClassifier(
    n_estimators=100,
    max_depth=20,
    min_samples_leaf=2,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)


# Train and measure training time
start_time = time.perf_counter()

binary_model.fit(
    X_train,
    y_binary_train
)

binary_training_time = time.perf_counter() - start_time

print("Binary Random Forest training completed!")


# Predict and measure inference time
start_time = time.perf_counter()

binary_predictions = binary_model.predict(X_test)

binary_inference_time = time.perf_counter() - start_time


# Evaluate
binary_accuracy = accuracy_score(
    y_binary_test,
    binary_predictions
)

binary_precision = precision_score(
    y_binary_test,
    binary_predictions,
    zero_division=0
)

binary_recall = recall_score(
    y_binary_test,
    binary_predictions,
    zero_division=0
)

binary_f1 = f1_score(
    y_binary_test,
    binary_predictions,
    zero_division=0
)

binary_matrix = confusion_matrix(
    y_binary_test,
    binary_predictions
)


print("\nBinary Accuracy:", round(binary_accuracy * 100, 2), "%")
print("Binary Precision:", round(binary_precision * 100, 2), "%")
print("Binary Recall:", round(binary_recall * 100, 2), "%")
print("Binary F1 Score:", round(binary_f1 * 100, 2), "%")

print("Training Time:", round(binary_training_time, 2), "seconds")
print("Inference Time:", round(binary_inference_time, 2), "seconds")

print("Confusion Matrix:\n", binary_matrix)


# Save binary metrics
binary_metrics = {
    "accuracy": float(binary_accuracy),
    "precision": float(binary_precision),
    "recall": float(binary_recall),
    "f1_score": float(binary_f1),
    "training_time": float(binary_training_time),
    "inference_time": float(binary_inference_time),
    "confusion_matrix": binary_matrix.tolist()
}

with open(MODEL_DIR / "ml_binary_metrics.json", "w") as file:
    json.dump(binary_metrics, file, indent=4)


# Save binary model
joblib.dump(
    binary_model,
    MODEL_DIR / "ml_binary_model.pkl"
)

print("\nBinary model and metrics saved!")


# ==================================================
# 3. MULTICLASS RANDOM FOREST MODEL
# ==================================================

print("\n========== MULTICLASS RANDOM FOREST ==========")

multi_model = RandomForestClassifier(
    n_estimators=100,
    max_depth=20,
    min_samples_leaf=2,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)


# Train and measure training time
start_time = time.perf_counter()

multi_model.fit(
    X_train,
    y_multi_train
)

multi_training_time = time.perf_counter() - start_time

print("Multiclass Random Forest training completed!")


# Predict and measure inference time
start_time = time.perf_counter()

multi_predictions = multi_model.predict(X_test)

multi_inference_time = time.perf_counter() - start_time


# Evaluate
multi_accuracy = accuracy_score(
    y_multi_test,
    multi_predictions
)

multi_report = classification_report(
    y_multi_test,
    multi_predictions,
    target_names=label_encoder.classes_,
    output_dict=True,
    zero_division=0
)

multi_matrix = confusion_matrix(
    y_multi_test,
    multi_predictions
)


print("\nMulticlass Accuracy:", round(multi_accuracy * 100, 2), "%")

print("\nClassification Report:\n")

print(
    classification_report(
        y_multi_test,
        multi_predictions,
        target_names=label_encoder.classes_,
        zero_division=0
    )
)

print("Training Time:", round(multi_training_time, 2), "seconds")
print("Inference Time:", round(multi_inference_time, 2), "seconds")

print("\nConfusion Matrix:\n", multi_matrix)


# Save multiclass metrics
multi_metrics = {
    "accuracy": float(multi_accuracy),
    "macro_precision": float(multi_report["macro avg"]["precision"]),
    "macro_recall": float(multi_report["macro avg"]["recall"]),
    "macro_f1": float(multi_report["macro avg"]["f1-score"]),
    "weighted_f1": float(multi_report["weighted avg"]["f1-score"]),
    "training_time": float(multi_training_time),
    "inference_time": float(multi_inference_time),
    "classification_report": multi_report,
    "confusion_matrix": multi_matrix.tolist()
}

with open(MODEL_DIR / "ml_multiclass_metrics.json", "w") as file:
    json.dump(multi_metrics, file, indent=4)


# Save multiclass model
joblib.dump(
    multi_model,
    MODEL_DIR / "ml_multiclass_model.pkl"
)

print("\nMulticlass model and metrics saved!")


# ==================================================
# 4. SAVE LABEL ENCODER
# ==================================================

joblib.dump(
    label_encoder,
    MODEL_DIR / "ml_label_encoder.pkl"
)


print("\n========== RANDOM FOREST TRAINING COMPLETED ==========")
