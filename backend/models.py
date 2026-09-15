from sqlalchemy import Column, Integer, String, Text
from database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    company = Column(String, nullable=False)
    role = Column(String, nullable=False)
    location = Column(String, nullable=True)
    url = Column(String, nullable=True)
    applied_date = Column(String, nullable=True)
    status = Column(String, default="Applied")
    notes = Column(Text, nullable=True)
