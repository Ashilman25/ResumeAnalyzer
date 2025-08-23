# backend/services/ai_client_async.py
import os, json, re
from importlib.resources import files as pkg_files
from openai import AsyncOpenAI

# Package-relative prompt loads
SECTION_PROMPT = pkg_files("backend.prompts").joinpath("section_prompt.txt").read_text(encoding="utf-8")
DRAFT_PROMPT   = pkg_files("backend.prompts").joinpath("draft_prompt.txt").read_text(encoding="utf-8")

ac = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def _safe_json_loads(raw: str) -> dict:
    m = re.search(r"\{.*\}", raw, re.S)
    if not m:
        raise ValueError("No JSON object found")
    return json.loads(m.group())

async def score_section_async(section_name: str, section_text: str, industry: str):
    prompt = SECTION_PROMPT.format(
        industry=industry,
        section_name=section_name,
        section_text=section_text[:4000]
    )

    resp = await ac.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )

    raw = resp.choices[0].message.content
    try:
        return _safe_json_loads(raw)
    except Exception as exc:
        print("JSON parse failure in score_section_async:", exc, raw[:500])
        return {
            "section": section_name,
            "score": 60,
            "strengths": [],
            "improvements": [],
            "rewrittenBullets": [],
        }

async def create_draft_html(full_text: str, sections_json: list):
    prompt = DRAFT_PROMPT.format(
        full_resume_text = full_text[:12000],
        sections_json    = json.dumps(sections_json)
    )
    resp = await ac.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2
    )

    raw = resp.choices[0].message.content.strip()
    if raw.startswith("```"):
        import re as _re
        raw = _re.sub(r"^```[\w]*\s*|\s*```$", "", raw, flags=_re.S).strip()

    return raw
