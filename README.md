# rag-chatbot

Minimal instructions to set up and run this project on Windows after pulling the repository.

## Prerequisites
- Python 3.9+ installed and on PATH
- git (optional, if you clone the repo)
- Internet access to install pip packages

Project layout (important files)
- backend/app.py — backend service
- backend/streamlit_app.py — Streamlit UI
- backend/Requirements.txt — Python dependencies
- backend/.env — environment variables (create/edit as needed)

---

## 1) Open a terminal in project root (Terminal A)
Open PowerShell or Command Prompt at:
```
C:\Users\pc\Desktop\rag-chatbot
```

---

## 2) Create and activate a virtual environment in Backend (Terminal A)

Command Prompt (cmd.exe):
```
cd .\backend\

```


PowerShell:
```
python -m venv .venv
# if execution policy blocks activation, run:
# Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.venv\Scripts\Activate.ps1
```


Confirm venv active: prompt starts with `(.venv)` and run:
```
python --version
pip --version
```

---

## 3) Upgrade pip (recommended) (Terminal A)
```
python -m pip install --upgrade pip
```

---

## 4) Install requirements (Terminal A)
```
pip install -r backend\Requirements.txt
```

If you see missing packages later, re-run the command.

---

## 5) Configure environment variables (Terminal A)
If `backend/.env` is required, create or edit it. Example:
```
# backend\.env
FLASK_ENV=development
OPENAI_API_KEY=your_api_key_here
OTHER_VAR=value
```
Open with Notepad:
```
notepad backend\.env
```

---

## 6) Run the backend (Terminal A)
Open Terminal A, activate the venv, then:

Option 1 — direct run (if app.py is executable):
```
python backend\app.py
```

# PowerShell / CMD (Terminal A):

```

Confirm backend is running:
- Visit: http://localhost:5000/health
- Or PowerShell:
```
Invoke-WebRequest http://localhost:5000/health -UseBasicParsing

## 7) Run Streamlit UI (Terminal B)

Open a second terminal ,then:

Command Prompt (cmd.exe):
```
cd .\backend\

```

## 7) Run Streamlit UI (Terminal B)
Open a second terminal, then:
```
streamlit run streamlit_app.py
```
Streamlit will open at http://localhost:8501 by default.

---

## 8) Using the app
- Use the Streamlit UI to upload documents and build the index (if provided).
- Ask questions in the chat; Streamlit will call the backend endpoints (default: port 5000).

Optional: run index builder script (if present)
```
python backend\embedding\build_index.py
```

---

## Common commands
Deactivate venv:
```
deactivate
```

Reinstall dependencies:
```
pip install -r backend\Requirements.txt
```

Check open ports (if conflict):
```
netstat -ano | findstr :5000
```

---

## Troubleshooting
- "ModuleNotFoundError": ensure venv activated and packages installed in that venv.
- Streamlit doesn't open: ensure `streamlit` is installed in the activated venv.
- Backend connection errors in UI: confirm backend running at http://localhost:5000 and health endpoint returns OK.
- PowerShell activation blocked: run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in that session.
- If you get errors during index build/upload, check `backend/temp_uploads` for saved files and backend logs for stack traces.

---

If anything fails, copy the terminal error text and share it for help.
