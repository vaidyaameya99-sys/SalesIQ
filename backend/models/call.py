import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship, DeclarativeBase

class Base(DeclarativeBase):
    pass

def gen_id():
    return str(uuid.uuid4())

class Call(Base):
    __tablename__ = "calls"

    id              = Column(String, primary_key=True, default=gen_id)
    rep_name        = Column(String, nullable=True)
    prospect_name   = Column(String, nullable=True)
    company         = Column(String, nullable=True)
    call_date       = Column(String, nullable=True)
    call_type       = Column(String, nullable=True)  # user-supplied hint
    file_path       = Column(String, nullable=True)
    file_type       = Column(String, nullable=True)  # audio | text
    status          = Column(String, default="pending")  # pending | processing | complete | error
    error_message   = Column(Text, nullable=True)
    created_at      = Column(DateTime, default=datetime.utcnow)
    updated_at      = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    analysis = relationship("CallAnalysis", back_populates="call", uselist=False, cascade="all, delete-orphan")

class CallAnalysis(Base):
    __tablename__ = "call_analyses"

    id                  = Column(String, primary_key=True, default=gen_id)
    call_id             = Column(String, ForeignKey("calls.id"), nullable=False)

    # Agent 1 output
    transcript          = Column(Text, nullable=True)

    # Agent 2 output
    classification      = Column(JSON, nullable=True)
    # {call_type, confidence, summary, rep_name, prospect_name, company, duration_minutes, key_topics}

    # Agent 3 output
    sentiment_data      = Column(JSON, nullable=True)
    # {timeline: [{minute, positive, negative, neutral}], mood_shifts, engagement_level, emotional_triggers}

    # Agent 4 output
    failure_points      = Column(JSON, nullable=True)
    # [{timestamp, what_happened, severity, root_cause_category, transcript_excerpt}]

    # Agent 5 output
    coaching_responses  = Column(JSON, nullable=True)
    # [{alternative_phrasing, why_it_works, examples_from_winning_calls}]

    # Agent 6 output
    pre_call_briefing   = Column(JSON, nullable=True)
    # {recommended_approach, prospect_triggers, objections_to_expect, opening_lines, questions_to_ask}

    # Aggregate scores
    overall_score       = Column(Float, default=0.0)
    verdict             = Column(String, default="Neutral")  # Strong | Neutral | Weak | Lost

    created_at          = Column(DateTime, default=datetime.utcnow)

    call = relationship("Call", back_populates="analysis")
