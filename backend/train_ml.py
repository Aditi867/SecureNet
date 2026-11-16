
import json
import time
import joblib

from pathlib import Path
from preprocess import preprocess_data

from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)

from xgboost import XGBClassifier


# ==================================================
# 1. PATHS
# ==================================================

MODEL_DIR = Path(__file__).parent / "saved_models"
MODEL_DIR.mkdir(exist_ok=True)


# ==================================================
# 2. LOAD PREPROCESSED DATA
# ==================================================

print("\nLoading and preprocessing dataset...")

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

print("\nDataset ready!")
print("Training records:", len(X_train))
print("Testing records:", len(X_test))
print("Input features:", X_train.shape[1])


# ==================================================
# 3. DEFINE FIVE ML ALGORITHMS
# ==================================================

def get_models(task):

    models = {
        "Decision Tree": DecisionTreeClassifier(
            max_depth=20,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=42
        ),

        "Random Forest": RandomForestClassifier(
            n_estimators=100,
            max_depth=20,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1
        ),

        "Logistic Regression": LogisticRegression(
            max_iter=1000,
            class_weight="balanced",
            random_state=42,
            solver="lbfgs"
        ),

        "Gaussian Naive Bayes": GaussianNB()
    }

    if task == "binary":

        models["XGBoost"] = XGBClassifier(
            n_estimators=150,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            objective="binary:logistic",
            eval_metric="logloss",
            tree_method="hist",
            random_state=42,
            n_jobs=-1
        )

    else:

        models["XGBoost"] = XGBClassifier(
            n_estimators=150,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            objective="multi:softprob",
            num_class=len(label_encoder.classes_),
            eval_metric="mlogloss",
            tree_method="hist",
            random_state=42,
            n_jobs=-1
        )

    return models


# ==================================================
# 4. TRAIN AND EVALUATE MODELS
# ==================================================

def train_and_evaluate(
    models,
    X_train,
    X_test,
    y_train,
    y_test,
    task
):

    results = {}

    for model_name, model in models.items():

        print("\n" + "=" * 55)
        print(f"{task.upper()} - {model_name}")
        print("=" * 55)

        # Training
        print("Training model...")

        start_time = time.perf_counter()

        if model_name in [
            "Gaussian Naive Bayes",
            "XGBoost"
        ]:

            # Balance training samples for these algorithms
            from sklearn.utils.class_weight import compute_sample_weight

            sample_weights = compute_sample_weight(
                class_weight="balanced",
                y=y_train
            )

            model.fit(
                X_train,
                y_train,
                sample_weight=sample_weights
            )

        else:

            model.fit(
                X_train,
                y_train
            )

        training_time = time.perf_counter() - start_time

        print("Training completed!")

        # Prediction
        start_time = time.perf_counter()

        predictions = model.predict(X_test)

        inference_time = time.perf_counter() - start_time

        # Common metrics
        accuracy = accuracy_score(
            y_test,
            predictions
        )

        matrix = confusion_matrix(
            y_test,
            predictions
        )

        if task == "binary":

            precision = precision_score(
                y_test,
                predictions,
                zero_division=0
            )

            recall = recall_score(
                y_test,
                predictions,
                zero_division=0
            )

            f1 = f1_score(
                y_test,
                predictions,
                zero_division=0
            )

            metrics = {
                "accuracy": float(accuracy),
                "precision": float(precision),
                "recall": float(recall),
                "f1_score": float(f1),
                "training_time": float(training_time),
                "inference_time": float(inference_time),
                "confusion_matrix": matrix.tolist()
            }

        else:

            report = classification_report(
                y_test,
                predictions,
                labels=list(range(len(label_encoder.classes_))),
                target_names=label_encoder.classes_,
                output_dict=True,
                zero_division=0
            )

            metrics = {
                "accuracy": float(accuracy),
                "macro_precision": float(report["macro avg"]["precision"]),
                "macro_recall": float(report["macro avg"]["recall"]),
                "macro_f1": float(report["macro avg"]["f1-score"]),
                "weighted_f1": float(report["weighted avg"]["f1-score"]),
                "training_time": float(training_time),
                "inference_time": float(inference_time),
                "classification_report": report,
                "confusion_matrix": matrix.tolist()
            }

        results[model_name] = metrics

        # Save individual model
        filename = (
            f"ml_{task}_{model_name.lower().replace(' ', '_')}.pkl"
        )

        joblib.dump(
            model,
            MODEL_DIR / filename
        )

        print("\nAccuracy:", round(accuracy * 100, 2), "%")
        print("Training time:", round(training_time, 2), "seconds")
        print("Inference time:", round(inference_time, 2), "seconds")

        if task == "binary":

            print("Precision:", round(precision * 100, 2), "%")
            print("Recall:", round(recall * 100, 2), "%")
            print("F1 Score:", round(f1 * 100, 2), "%")

        else:

            print("Macro F1:", round(metrics["macro_f1"] * 100, 2), "%")
            print("Weighted F1:", round(metrics["weighted_f1"] * 100, 2), "%")

        print("\nConfusion Matrix:\n", matrix)

    return results


# ==================================================
# 5. BINARY CLASSIFICATION
# ==================================================

print("\n\n========== BINARY CLASSIFICATION ==========")

binary_models = get_models("binary")

binary_results = train_and_evaluate(
    binary_models,
    X_train,
    X_test,
    y_binary_train,
    y_binary_test,
    "binary"
)


# ==================================================
# 6. MULTICLASS CLASSIFICATION
# ==================================================

print("\n\n========== MULTICLASS CLASSIFICATION ==========")

multi_models = get_models("multiclass")

multi_results = train_and_evaluate(
    multi_models,
    X_train,
    X_test,
    y_multi_train,
    y_multi_test,
    "multiclass"
)


# ==================================================
# 7. SAVE METRICS
# ==================================================

# Preserve the existing Random Forest model filenames
# and metric fields for compatibility with the old API.

binary_metrics = {
    **binary_results["Random Forest"],
    "models": binary_results
}

multi_metrics = {
    **multi_results["Random Forest"],
    "models": multi_results
}


with open(MODEL_DIR / "ml_binary_metrics.json", "w") as file:
    json.dump(binary_metrics, file, indent=4)


with open(MODEL_DIR / "ml_multiclass_metrics.json", "w") as file:
    json.dump(multi_metrics, file, indent=4)


# Save label encoder
joblib.dump(
    label_encoder,
    MODEL_DIR / "ml_label_encoder.pkl"
)


# Preserve previous Random Forest model filenames
joblib.dump(
    binary_models["Random Forest"],
    MODEL_DIR / "ml_binary_model.pkl"
)

joblib.dump(
    multi_models["Random Forest"],
    MODEL_DIR / "ml_multiclass_model.pkl"
)


# ==================================================
# 8. FINAL SUMMARY
# ==================================================

print("\n\n========== FINAL MODEL COMPARISON ==========")

print("\nBINARY CLASSIFICATION")

for name, metrics in binary_results.items():

    print(
        name,
        "| Accuracy:", round(metrics["accuracy"] * 100, 2),
        "% | F1:", round(metrics["f1_score"] * 100, 2),
        "% | Training:", round(metrics["training_time"], 2),
        "sec"
    )


print("\nMULTICLASS CLASSIFICATION")

for name, metrics in multi_results.items():

    print(
        name,
        "| Accuracy:", round(metrics["accuracy"] * 100, 2),
        "% | Macro F1:", round(metrics["macro_f1"] * 100, 2),
        "% | Training:", round(metrics["training_time"], 2),
        "sec"
    )


print("\nAll models and metrics saved successfully!")
print("========== TRAINING COMPLETED ==========")
