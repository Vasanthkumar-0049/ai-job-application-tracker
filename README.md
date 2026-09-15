# AI Job Application Tracker

Full-stack fresher portfolio project using React, FastAPI, SQLite, SQLAlchemy and TF-IDF.

## Run backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend: http://127.0.0.1:8000
Swagger: http://127.0.0.1:8000/docs

## Run frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the URL Vite displays, usually http://localhost:5173.

## Features

- Add, view, edit and delete job applications
- SQLite database
- Search and status filtering
- Dashboard statistics
- Resume/JD matching using TF-IDF + cosine similarity
- REST API with FastAPI
- React frontend with hooks and fetch
