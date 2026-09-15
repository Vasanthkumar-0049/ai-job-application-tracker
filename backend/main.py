from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from database import Base, engine, SessionLocal
from models import Job
from schemas import JobCreate, JobUpdate, JobResponse, MatchRequest

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Job Application Tracker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
        "http://localhost:5174","https://ai-job-application-tracker01-omega.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def root():
    return {"message": "Job Tracker API is running"}

@app.get("/jobs", response_model=list[JobResponse])
def get_jobs(db: Session = Depends(get_db)):
    return db.query(Job).order_by(Job.id.desc()).all()

@app.post("/jobs", response_model=JobResponse)
def create_job(job: JobCreate, db: Session = Depends(get_db)):
    new_job = Job(**job.model_dump())
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job

@app.put("/jobs/{job_id}", response_model=JobResponse)
def update_job(job_id: int, job: JobUpdate, db: Session = Depends(get_db)):
    existing = db.query(Job).filter(Job.id == job_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Job not found")

    for key, value in job.model_dump().items():
        setattr(existing, key, value)

    db.commit()
    db.refresh(existing)
    return existing

@app.delete("/jobs/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    existing = db.query(Job).filter(Job.id == job_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Job not found")

    db.delete(existing)
    db.commit()
    return {"message": "Job deleted successfully"}

@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    jobs = db.query(Job).all()
    return {
        "total": len(jobs),
        "applied": sum(j.status == "Applied" for j in jobs),
        "interview": sum(j.status == "Interview" for j in jobs),
        "selected": sum(j.status == "Selected" for j in jobs),
        "rejected": sum(j.status == "Rejected" for j in jobs),
    }

@app.post("/match")
def match_resume(data: MatchRequest):
    resume = data.resume.strip()
    jd = data.job_description.strip()

    if not resume or not jd:
        raise HTTPException(status_code=400, detail="Resume and job description are required")

    vectorizer = TfidfVectorizer(stop_words="english")
    matrix = vectorizer.fit_transform([resume, jd])
    score = float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0] * 100)

    resume_words = set(vectorizer.get_feature_names_out())
    jd_words = set(
        word.lower()
        for word in jd.split()
        if word.isalpha() and len(word) > 2
    )
    missing = sorted(list(jd_words - resume_words))[:20]

    return {
        "match_score": round(score, 2),
        "message": "Strong match" if score >= 70 else "Moderate match" if score >= 45 else "Low match",
        "keywords_in_resume": sorted(list(resume_words & jd_words)),
        "possible_missing_keywords": missing
    }
