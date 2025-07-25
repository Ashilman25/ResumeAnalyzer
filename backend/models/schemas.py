from pydantic import BaseModel
from typing import List, Literal, Optional

class Highlight(BaseModel):
    start: int
    end: int
    severity: Literal["red","yellow","green"]
    comment: str

class SectionResult(BaseModel):
    section: str
    score: int
    strengths: List[str]
    improvements: List[str]
    rewrittenBullets: List[str]
    highlights: Optional[List[Highlight]] = None

class OverallResult(BaseModel):
    industry: str
    score: int
    summary: str
    globalRecommendations: Optional[str] = None

class AnalysisResponse(BaseModel):
    overall: OverallResult
    sections: List[SectionResult]
