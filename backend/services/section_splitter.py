import re
HEADERS = [
    ("Summary",            r"(summary|objective|profile|professional summary|career objective)"),
    ("Key Achievements",   r"(key achievements|accomplishments|highlights)"),
    ("Experience",         r"(experience|work history|professional experience|employment( history)?|work experience)"),
    ("Database Experience",r"(database experience|dba experience)"),
    ("Education",          r"(education|eduction|academic background|degrees|qualifications)"),
    ("Skills",             r"(skills|technical skills|core competencies|expertise|proficiencies)"),
    ("Projects",           r"(projects|selected projects|personal projects|professional projects)"),
    ("Certifications",     r"(certifications|certificates|licenses|accreditations)"),
    ("Languages",          r"(languages|language proficiency|spoken languages)"),
    ("Publications",       r"(publications|research|papers|articles)"),
    ("Volunteer",          r"(volunteer|community service|community involvement)"),
    ("Awards",             r"(awards|honors|achievements|recognitions)"),
    ("References",         r"(references|recommendations?)"),
    ("Activities",         r"(activities|extracurricular|extracurricular activities|interests|hobbies)")
]

def split_sections(full_text: str):
    text = full_text.replace("\r", "")

    group_map = {}
    patterns = []
    for i, (label, pat) in enumerate(HEADERS):
        gname = f"h{i}"               # safe name
        group_map[gname] = label
        patterns.append(rf"^(?P<{gname}>{pat})\s*:?\s*$")

    big_re = re.compile("|".join(patterns), re.IGNORECASE | re.MULTILINE)

    matches = []
    for m in big_re.finditer(text):
        label = group_map.get(m.lastgroup)
        if label:
            matches.append((m.start(), label))

    if not matches:
        return [{"name": "FullResume", "text": text.strip()}]

    matches.sort()
    sections = []
    for i, (start, label) in enumerate(matches):
        end = matches[i+1][0] if i+1 < len(matches) else len(text)
        chunk = text[start:end].strip()
        sections.append({"name": label, "text": chunk})


    dedup = {}
    for s in sections:
        if s["name"] not in dedup or len(s["text"]) > len(dedup[s["name"]]["text"]):
            dedup[s["name"]] = s
    return list(dedup.values())
