
import json
import time
import torch
import joblib

from preprocess import preprocess_data
from model import BinaryClassifier, MultiClassClassifier
from torch.utils.data import TensorDataset, DataLoader

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)


# Make training reproducible
torch.manual_seed(42)


# ==================================================
# 1. LOAD PREPROCESSED DATASET
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
# 2. CONVERT DATA INTO PYTORCH TENSORS
# ==================================================

X_train_tensor = torch.tensor(
    X_train.values,
    dtype=torch.float32
)

X_test_tensor = torch.tensor(
    X_test.values,
    dtype=torch.float32
)

y_binary_train_tensor = torch.tensor(
    y_binary_train.values,
    dtype=torch.float32
).reshape(-1, 1)

y_binary_test_tensor = torch.tensor(
    y_binary_test.values,
    dtype=torch.float32
).reshape(-1, 1)

y_multi_train_tensor = torch.tensor(
    y_multi_train,
    dtype=torch.long
)

y_multi_test_tensor = torch.tensor(
    y_multi_test,
    dtype=torch.long
)


print("\nPyTorch data conversion successful!")
print("Training features:", X_train_tensor.shape)
print("Binary labels:", y_binary_train_tensor.shape)
print("Multiclass labels:", y_multi_train_tensor.shape)


# ==================================================
# 3. BINARY CLASSIFICATION MODEL
# ==================================================

binary_model = BinaryClassifier(input_size=202)

binary_criterion = torch.nn.BCEWithLogitsLoss()

binary_optimizer = torch.optim.Adam(
    binary_model.parameters(),
    lr=0.001
)

print("\nBinary model training setup successful!")
print(binary_model)


binary_dataset = TensorDataset(
    X_train_tensor,
    y_binary_train_tensor
)

binary_loader = DataLoader(
    binary_dataset,
    batch_size=256,
    shuffle=True
)

print("\nBinary training batches created!")
print("Total batches:", len(binary_loader))


# ==================================================
# 4. TRAIN BINARY MODEL
# ==================================================

binary_epochs = 1

binary_training_start = time.perf_counter()

binary_model.train()

for epoch in range(binary_epochs):

    total_loss = 0

    for X_batch, y_batch in binary_loader:

        binary_optimizer.zero_grad()

        outputs = binary_model(X_batch)

        loss = binary_criterion(
            outputs,
            y_batch
        )

        loss.backward()

        binary_optimizer.step()

        total_loss += loss.item()

    average_loss = total_loss / len(binary_loader)

    print(
        f"Binary Epoch [{epoch + 1}/{binary_epochs}], "
        f"Loss: {average_loss:.4f}"
    )

binary_training_time = (
    time.perf_counter() - binary_training_start
)

print("\nBinary model training completed!")
print("Binary training time:", round(binary_training_time, 2), "seconds")


# ==================================================
# 5. EVALUATE BINARY MODEL
# ==================================================

binary_model.eval()

binary_inference_start = time.perf_counter()

with torch.no_grad():

    predictions = binary_model(X_test_tensor)

    predictions = (
        torch.sigmoid(predictions) >= 0.5
    ).int()

binary_inference_time = (
    time.perf_counter() - binary_inference_start
)

y_true = y_binary_test_tensor.int()

accuracy = accuracy_score(
    y_true.numpy(),
    predictions.numpy()
)

precision = precision_score(
    y_true.numpy(),
    predictions.numpy(),
    zero_division=0
)

recall = recall_score(
    y_true.numpy(),
    predictions.numpy(),
    zero_division=0
)

f1 = f1_score(
    y_true.numpy(),
    predictions.numpy(),
    zero_division=0
)

binary_matrix = confusion_matrix(
    y_true.numpy(),
    predictions.numpy()
)


print("\n========== BINARY CLASSIFICATION RESULTS ==========")

print("Accuracy:", round(accuracy * 100, 2), "%")
print("Precision:", round(precision * 100, 2), "%")
print("Recall:", round(recall * 100, 2), "%")
print("F1 Score:", round(f1 * 100, 2), "%")

print("Training Time:", round(binary_training_time, 2), "seconds")
print("Inference Time:", round(binary_inference_time, 2), "seconds")

print("Confusion Matrix:\n", binary_matrix)


# Save binary evaluation metrics
binary_metrics = {
    "accuracy": float(accuracy),
    "precision": float(precision),
    "recall": float(recall),
    "f1_score": float(f1),
    "training_time": float(binary_training_time),
    "inference_time": float(binary_inference_time),
    "confusion_matrix": binary_matrix.tolist()
}

with open(
    "backend/saved_models/binary_metrics.json",
    "w"
) as file:

    json.dump(binary_metrics, file, indent=4)

print("\nBinary evaluation metrics saved successfully!")


# ==================================================
# 6. MULTICLASS CLASSIFICATION MODEL
# ==================================================

multi_model = MultiClassClassifier(
    input_size=202,
    num_classes=10
)


# Calculate class counts
class_counts = torch.bincount(
    y_multi_train_tensor,
    minlength=10
).float()


# Calculate balanced class weights
class_weights = 1.0 / torch.sqrt(class_counts)

class_weights = class_weights / class_weights.mean()


# Define weighted loss function
multi_criterion = torch.nn.CrossEntropyLoss(
    weight=class_weights
)

print("\nClass weights:", class_weights)


# Define optimizer
multi_optimizer = torch.optim.Adam(
    multi_model.parameters(),
    lr=0.001
)


# Create multiclass dataset
multi_dataset = TensorDataset(
    X_train_tensor,
    y_multi_train_tensor
)

multi_loader = DataLoader(
    multi_dataset,
    batch_size=256,
    shuffle=True
)

print("\nMulticlass model setup successful!")
print("Total batches:", len(multi_loader))
print(multi_model)


# ==================================================
# 7. TRAIN MULTICLASS MODEL
# ==================================================

multi_epochs = 5

multi_training_start = time.perf_counter()

multi_model.train()

for epoch in range(multi_epochs):

    total_loss = 0

    for X_batch, y_batch in multi_loader:

        multi_optimizer.zero_grad()

        outputs = multi_model(X_batch)

        loss = multi_criterion(
            outputs,
            y_batch
        )

        loss.backward()

        multi_optimizer.step()

        total_loss += loss.item()

    average_loss = total_loss / len(multi_loader)

    print(
        f"Multiclass Epoch [{epoch + 1}/{multi_epochs}], "
        f"Loss: {average_loss:.4f}"
    )

multi_training_time = (
    time.perf_counter() - multi_training_start
)

print("\nMulticlass model training completed!")
print("Multiclass training time:", round(multi_training_time, 2), "seconds")


# ==================================================
# 8. EVALUATE MULTICLASS MODEL
# ==================================================

multi_model.eval()

multi_inference_start = time.perf_counter()

with torch.no_grad():

    predictions = multi_model(X_test_tensor)

    predictions = torch.argmax(
        predictions,
        dim=1
    )

multi_inference_time = (
    time.perf_counter() - multi_inference_start
)

y_true = y_multi_test_tensor

report = classification_report(
    y_true.numpy(),
    predictions.numpy(),
    target_names=label_encoder.classes_,
    output_dict=True,
    zero_division=0
)

multi_matrix = confusion_matrix(
    y_true.numpy(),
    predictions.numpy()
)


print("\n========== MULTICLASS CLASSIFICATION RESULTS ==========")

print("\nClassification Report:\n")

print(
    classification_report(
        y_true.numpy(),
        predictions.numpy(),
        target_names=label_encoder.classes_,
        zero_division=0
    )
)

print("\nTraining Time:", round(multi_training_time, 2), "seconds")
print("Inference Time:", round(multi_inference_time, 2), "seconds")

print("\nConfusion Matrix:\n")
print(multi_matrix)


# Save multiclass evaluation metrics
multi_metrics = {
    "classification_report": report,
    "training_time": float(multi_training_time),
    "inference_time": float(multi_inference_time),
    "confusion_matrix": multi_matrix.tolist()
}

with open(
    "backend/saved_models/multiclass_metrics.json",
    "w"
) as file:

    json.dump(multi_metrics, file, indent=4)

print("\nMulticlass evaluation metrics saved successfully!")


# ==================================================
# 9. SAVE TRAINED MODELS
# ==================================================

torch.save(
    binary_model.state_dict(),
    "backend/saved_models/binary_model.pth"
)

print("\nBinary model saved successfully!")


torch.save(
    multi_model.state_dict(),
    "backend/saved_models/multiclass_model.pth"
)

print("Multiclass model saved successfully!")


# ==================================================
# 10. SAVE PREPROCESSING OBJECTS
# ==================================================

joblib.dump(
    encoder,
    "backend/saved_models/encoder.pkl"
)

joblib.dump(
    scaler,
    "backend/saved_models/scaler.pkl"
)

joblib.dump(
    label_encoder,
    "backend/saved_models/label_encoder.pkl"
)

print("\nPreprocessing objects saved successfully!")

print("\n========== SECURENET TRAINING COMPLETED ==========")
