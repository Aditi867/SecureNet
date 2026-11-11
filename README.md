# SecureNet Frontend

A React + Vite starter for the SecureNet network intrusion detection dashboard.

## Requirements
- Node.js LTS
- VS Code (recommended)

## Run locally
1. Extract this folder.
2. Open the `SecureNet` folder in VS Code.
3. Open Terminal > New Terminal.
4. Run:

```bash
npm install
cp .env.example .env
npm run dev
```

5. Open the local URL printed by Vite (usually http://localhost:5173).

## Current status
- The dashboard UI is implemented.
- CSV selection is implemented.
- The frontend calls `POST /predict/binary` or `POST /predict/multiclass`.
- If the backend is not running, an explicitly labelled illustrative preview appears.
- Multi-class and Advanced Analysis are placeholders until those models are implemented.
- Never present illustrative preview data as real model results.

## Backend integration contract
Set `VITE_API_BASE_URL` in `.env` to the backend address, e.g. `http://127.0.0.1:8000`.

The frontend sends a multipart/form-data request with field name `file`.

Suggested response:

```json
{
  "total_records": 1000,
  "attack_count": 350,
  "benign_count": 650,
  "accuracy": null,
  "predictions": [
    {"prediction": "Attack", "probability": 0.97},
    {"prediction": "Benign", "probability": 0.91}
  ],
  "confusion_matrix": null,
  "classification_report": null
}
```

`accuracy`, `confusion_matrix`, and `classification_report` must be null when ground-truth labels are not available. If `confusion_matrix` is provided, use a 2x2 array ordered as `[[TN, FP], [FN, TP]]` for binary classification with class 1 = Attack.

## Important scientific safeguards
- The model must use the exact feature order and preprocessing saved during training.
- Fit scalers/encoders on training data only.
- Do not calculate accuracy from predictions without true labels.
- Keep test data separate from training and model selection.
- Record the dataset version, split, random seed and metrics in the project report.

  ## How to Run SecureNet Locally

Follow these steps whenever you want to run the SecureNet project.

### 1. Prerequisites

Make sure you have installed:
- Python
- Node.js and npm
- Required Python dependencies
- Project dependencies

### 2. Start the Backend (FastAPI)

1. Open Command Prompt.
2. Navigate to the project folder:

```bash
cd C:\Users\aditi\Downloads\SecureNet-Frontend-Starter\SecureNet
```

3. Start the backend server:

```bash
uvicorn backend.main:app --reload
```

4. Wait until you see:

```text
Uvicorn running on http://127.0.0.1:8000
Application startup complete.
```

Keep this terminal open.

### 3. Start the Frontend (React + Vite)

1. Open a **second Command Prompt window**.
2. Navigate to the same project folder:

```bash
cd C:\Users\aditi\Downloads\SecureNet-Frontend-Starter\SecureNet
```

3. Start the frontend:

```bash
npm run dev
```

4. Wait until you see the local URL:

```text
Local: http://localhost:5173/
```

### 4. Open SecureNet

Open the following URL in your browser:

**http://localhost:5173/**

The SecureNet dashboard should now be accessible.

### 5. Explore the Dashboard

The application has three main sections:

- **Binary Detection:** Upload a CSV dataset to classify network traffic as benign or attack.
- **Multi-Class Detection:** View multiclass classification performance and the confusion matrix.
- **Advanced Analysis:** Explore model evaluation metrics and visualizations.

### 6. Stop the Application

When finished:
- Go to the backend terminal and press `Ctrl + C`.
- Go to the frontend terminal and press `Ctrl + C`.

**Important:** Both backend and frontend servers must be running simultaneously for the application to work.

### Project URLs

- Frontend: http://localhost:5173/
- Backend API: http://127.0.0.1:8000/
- API Documentation: http://127.0.0.1:8000/docs

**Note:** The dataset and trained model files must be present locally. The dataset CSV files are excluded from GitHub through `.gitignore`.
