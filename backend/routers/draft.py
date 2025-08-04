from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import os, uuid, tempfile, asyncio
from backend.services import pdf_extract, section_splitter, ai_client_async, ai_client

router = APIRouter(prefix="/draft", tags=["draft"])

@router.post("")
async def create_draft(
    pdf: UploadFile = File(...),
    targetIndustry: str = Form(...),
):
    if pdf.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    uid = str(uuid.uuid4())
    tmp_path = os.path.join(tempfile.gettempdir(), f"{uid}.pdf")
    with open(tmp_path, "wb") as f:
        f.write(await pdf.read())

    full_text = pdf_extract.extract_pdf_text(tmp_path)
    if not full_text or len(full_text.strip()) < 50:
        raise HTTPException(status_code=422, detail="Could not extract text.")

    # reuse the existing analysis helpers to get improved bullets
    sections = section_splitter.split_sections(full_text)
    section_results = [
        await ai_client_async.score_section_async(s["name"], s["text"], targetIndustry)
        for s in sections
    ]

    draft_html = await ai_client_async.create_draft_html(full_text, section_results)

    try:
        os.remove(tmp_path)
    except OSError:
        pass

    return {"html": draft_html}
