import os
import uuid
import tempfile
import asyncio
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from backend.models.schemas import AnalysisResponse
from backend.services import pdf_extract, section_splitter
from backend.services import ai_client_async          # async section scorer
from backend.services import ai_client               # sync overall feedback

# NOTE: In main.py you mount this router with prefix="/api"
# so the final path becomes POST /api/analyze
router = APIRouter(prefix="/analyze", tags=["analyze"])

# Tune this to stay under your account’s rate limits
MAX_CONCURRENT_REQUESTS = 5


async def _run_limited(semaphore: asyncio.Semaphore, coro):
    """Utility to bound concurrency with a semaphore."""
    async with semaphore:
        return await coro


@router.post("", response_model=AnalysisResponse)
async def analyze_resume(
    pdf: UploadFile = File(...),
    targetIndustry: str = Form(...),
):
    # ------------------------------------------------------------------ input
    if pdf.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    uid = str(uuid.uuid4())
    temp_path = os.path.join(tempfile.gettempdir(), f"{uid}.pdf")

    # Save upload to a temporary file
    with open(temp_path, "wb") as f:
        f.write(await pdf.read())
        f.flush()

    # ---------------------------------------------------------------- extract
    text = pdf_extract.extract_pdf_text(temp_path)
    if not text or len(text.strip()) < 50:
        raise HTTPException(status_code=422, detail="Could not extract text from PDF.")

    sections = section_splitter.split_sections(text)

    # ---------------------------------------------------------------- score sections in parallel
    semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
    tasks = [
        _run_limited(
            semaphore,
            ai_client_async.score_section_async(s["name"], s["text"], targetIndustry),
        )
        for s in sections
    ]
    section_results = await asyncio.gather(*tasks)

    # ---------------------------------------------------------------- overall feedback (sync; single call)
    overall = ai_client.global_feedback(section_results, targetIndustry)

    # ---------------------------------------------------------------- cleanup + response
    try:
        os.remove(temp_path)
    except OSError:
        pass

    return AnalysisResponse(overall=overall, sections=section_results)
