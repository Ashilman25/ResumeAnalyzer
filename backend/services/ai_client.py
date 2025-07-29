import os, json, re
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


SECTION_PROMPT = open("backend/prompts/section_prompt.txt").read()
GLOBAL_PROMPT = open("backend/prompts/global_prompt.txt").read()

def safe_json_loads(raw):
    # grab first JSON object in the string
    m = re.search(r'\{.*\}', raw, re.S)
    if not m:
        raise ValueError("No JSON object found")
    return json.loads(m.group())

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
        return safe_json_loads(raw)
    except Exception as e:
        print("JSON parse fail:", e, raw[:2000])
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
