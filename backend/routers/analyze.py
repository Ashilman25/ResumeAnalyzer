from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from backend.services import pdf_extract, section_splitter, ai_client
from openai import OpenAI
import os
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
from backend.models.schemas import AnalysisResponse
import tempfile, os, uuid

router = APIRouter(prefix="/analyze", tags=["analyze"])

@router.post("", response_model=AnalysisResponse)
async def analyze_resume(pdf: UploadFile = File(...),
                         targetIndustry: str = Form(...)):
    if pdf.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF accepted.")

    uid = str(uuid.uuid4())
    temp_path = os.path.join(tempfile.gettempdir(), f"{uid}.pdf")
    print(f"Temp file path: {temp_path}")
    with open(temp_path, "wb") as f:
        f.write(await pdf.read())
        f.flush()

    from backend.services.pdf_extract import extract_pdf_text

    text = extract_pdf_text(temp_path)
    print(f"Extracted text: {repr(text)}")  # Add this line for debugging
    if not text or len(text.strip()) < 50:
        raise HTTPException(status_code=422, detail="Could not extract text.")

    sections = section_splitter.split_sections(text)
    print(f"Detected {len(sections)} sections: {[s['name'] for s in sections]}")
    
    section_results = []
    for s in sections:
        print(f"Analyzing section: {s['name']} ({len(s['text'])} characters)")
        section_json = ai_client.score_section(s["name"], s["text"], targetIndustry)
        section_results.append(section_json)

    overall = ai_client.global_feedback(section_results, targetIndustry)

    try:
        os.remove(temp_path)
    except OSError:
        pass

    return AnalysisResponse(overall=overall, sections=section_results)
