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
