# SecureNet – Deep Learning-Based Network Intrusion Detection System

SecureNet is a network intrusion detection dashboard built using React, FastAPI, Machine Learning, and Deep Learning. It analyses network traffic, classifies potential attacks, compares ML and DL models, and supports live network traffic monitoring.

## Features

- **Binary Detection:** Classifies network traffic as Normal or Attack.
- **Multi-Class Detection:** Identifies different categories of network attacks.
- **Advanced Analysis:** Displays model evaluation metrics and visualisations.
- **ML vs DL Comparison:** Compares machine learning and deep learning model performance.
- **Live Monitoring:** Captures and analyses live network flows.
- **Explainable AI:** Uses SHAP to explain individual live predictions.
- **Detection History:** Stores live detection records using SQLite.
- **CSV Export:** Exports detection history for further analysis.

## Technology Stack

**Frontend**
- React
- Vite
- Recharts
- Lucide React

**Backend**
- Python
- FastAPI
- Scikit-learn
- PyTorch
- XGBoost
- SHAP
- NFStream
- SQLite

## Requirements

Install the following before running the project:

- Python 3.10 or 3.11 recommended
- Node.js LTS and npm
- Git
- VS Code (recommended)

For live network monitoring on Windows:
- Npcap must be installed.
- A supported network interface is required.
- Administrator permissions may be required for packet capture.

## 1. Clone the Repository

Open Command Prompt and run:

```bash
git clone https://github.com/Aditi867/SecureNet.git
cd SecureNet
```

## 2. Set Up the Backend

Create a Python virtual environment:

```bash
python -m venv .venv
```

Activate it:

```bash
.venv\Scripts\activate
```

Install the backend dependencies:

```bash
python -m pip install --upgrade pip
pip install -r backend/requirements.txt
```

Start the FastAPI backend:

```bash
python -m uvicorn backend.main:app --reload
```

The backend will run at:

http://127.0.0.1:8000

API documentation:

http://127.0.0.1:8000/docs

Keep this terminal running.

## 3. Set Up the Frontend

Open a second terminal in the project directory.

Install the frontend dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

Open the URL displayed by Vite, usually:

http://localhost:5173/

Keep both frontend and backend terminals running.

## 4. Using SecureNet

Once both servers are running, explore the dashboard:

1. Binary Detection – Upload network traffic CSV data for binary classification.
2. Multi-Class – Analyse network traffic across multiple attack categories.
3. Advanced Analysis – Explore model metrics and visualisations.
4. ML vs DL Comparison – Compare trained model performance.
5. Live Monitoring – Start monitoring supported live network interfaces.
6. Explain with AI – View SHAP-based explanations for selected live flows.
7. Detection History – Review stored detections and export them as CSV.

## 5. Trained Models and Datasets

Pre-trained model files are included in `backend/saved_models/`.

Large raw datasets and local traffic capture files are excluded from this repository to keep the download manageable.

The pre-trained models can be used for inference without downloading the original training datasets. Training or retraining models requires the corresponding datasets.

## 6. Live Monitoring Notes

Live Monitoring uses NFStream to capture and analyse network flows.

On Windows:
- Install Npcap before starting live capture.
- Select an available network interface.
- Run with the necessary permissions for packet capture.

Live predictions are model-generated assessments, not confirmation that a network flow is malicious or safe.

## 7. Stopping the Application

Press `Ctrl + C` in both terminal windows to stop the backend and frontend servers.

## Project Structure

```text
SecureNet/
│
├── backend/
│   ├── main.py
│   ├── live_controller.py
│   ├── live_explain.py
│   ├── live_history.py
│   ├── live_monitor.py
│   ├── live_predict.py
│   ├── live_worker.py
│   ├── requirements.txt
│   ├── saved_models/
│   └── data/
│
├── src/
│   ├── components/
│   ├── App.jsx
│   └── style.css
│
├── package.json
├── package-lock.json
└── README.md
```

## Repository

GitHub: https://github.com/Aditi867/SecureNet

**SecureNet – Network Intrusion Detection and Analysis**