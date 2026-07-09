# FaceAI Project Structure

Version: 0.1

---

## Project Overview

FaceAI is divided into two main parts:

- Backend (FastAPI + AI Engine)
- Frontend (Web UI)

The project is organized to keep each responsibility isolated and maintainable.

---

## Current Directory Structure

```
FaceAI/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py
│   ├── requirements.txt
│   └── .venv/
│
├── frontend/
│   ├── css/
│   │   └── style.css
│   │
│   ├── js/
│   │   ├── app.js
│   │   ├── camera.js
│   │   └── ui.js
│   │
│   ├── images/
│   └── index.html
│
├── datasets/
│
├── docs/
│
├── models/
│
├── tests/
│
├── .gitignore
│
└── README.md
```

---

## Folder Responsibilities

### backend/

Contains API, AI processing, face recognition logic, and database interaction.

---

### frontend/

Contains all user interface code.

---

### datasets/

Stores datasets used for training and evaluation.

Examples:

- Kaggle datasets
- User captured images
- Validation datasets

---

### models/

Stores trained AI models.

Examples:

- ONNX
- TensorFlow
- PyTorch

---

### tests/

Contains testing scripts.

Examples:

- API testing
- Camera testing
- Face detection testing

---

### docs/

Contains project documentation.

---

## JavaScript Modules

Current modules

```
app.js
```

Application entry point.

```
camera.js
```

Camera management.

```
ui.js
```

UI manipulation.

Future modules

```
detection.js
capture.js
recognition.js
rating.js
storage.js
dataset.js
timer.js
```

---

## Design Principles

- Modular
- Simple
- Maintainable
- Testable
- Incremental Development
