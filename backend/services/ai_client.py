import os, json
from openai import OpenAI

client = OpenAI(api_key=os.getenv("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"))


SECTION_PROMPT = open("backend/prompts/section_prompt.txt").read()
GLOBAL_PROMPT = open("backend/prompts/global_prompt.txt").read()

def score_section(section_name: str, section_text: str, industry: str):
    prompt = SECTION_PROMPT.format(
        industry=industry,
        section_name=section_name,
        section_text=section_text[:4000]
    )
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    raw = resp.choices[0].message.content
    try:
        return json.loads(raw)
    except Exception:
        return {
            "section": section_name,
            "score": 60,
            "strengths": [],
            "improvements": [],
            "rewrittenBullets": []
        }

def global_feedback(section_results, industry: str):
    prompt = GLOBAL_PROMPT.format(all_sections_json=json.dumps(section_results))
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role":"user","content":prompt}],
        temperature=0.3
    )
    text = resp.choices[0].message.content.strip()
    scores = [s.get("score",0) for s in section_results]
    overall_score = int(sum(scores)/len(scores)) if scores else 0
    return {
        "industry": industry,
        "score": overall_score,
        "summary": text.split(".")[0] + "." if text else "",
        "globalRecommendations": text
    }
