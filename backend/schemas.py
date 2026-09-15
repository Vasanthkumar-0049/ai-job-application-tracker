from pydantic import BaseModel

class JobCreate(BaseModel):
    company: str
    role: str
    location: str = ""
    url: str = ""
    applied_date: str = ""
    status: str = "Applied"
    notes: str = ""

class JobUpdate(JobCreate):
    pass

class JobResponse(JobCreate):
    id: int

    class Config:
        from_attributes = True

class MatchRequest(BaseModel):
    resume: str
    job_description: str
