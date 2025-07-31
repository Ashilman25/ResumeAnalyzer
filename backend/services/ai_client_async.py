import os
import json
import re
from openai import AsyncOpenAI


ac = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
SECTION_PROMPT = open("backend/prompts/section_prompt.txt").read()

# ---------- Helpers ----------------------------------------------------------
def _safe_json_loads(raw: str) -> dict:
    """
    Pull the first {...} JSON blob out of the assistant’s reply and parse it.
    Raises if nothing JSON-like is found.
    """
    match = re.search(r"\{.*\}", raw, re.S)
    if not match:
        raise ValueError("No JSON object found")
    return json.loads(match.group())


# ---------- Async scoring wrapper -------------------------------------------
async def score_section_async(section_name: str, section_text: str, industry: str):
    """
    One-shot prompt → JSON result for a single résumé section.

    Returns a dict that matches `SectionResult` in schemas.py.
    On JSON-parse failure we fall back to a conservative stub so processing continues.
    """
    prompt = SECTION_PROMPT.format(
        industry=industry,
        section_name=section_name,
        section_text=section_text[:4000]  # keep token cost bounded
    )

    response = await ac.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )

    raw = response.choices[0].message.content
    try:
        return _safe_json_loads(raw)
    except Exception as exc:
        # Log the failure but don’t crash the request
        print("JSON parse failure in score_section_async:", exc, raw[:500])
        return {
            "section": section_name,
            "score": 60,
            "strengths": [],
            "improvements": [],
            "rewrittenBullets": [],
        }
