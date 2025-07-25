import re

HEADERS = [
    ("Experience", r"(experience|work history|professional experience)"),
    ("Education", r"(education|academic background)"),
    ("Skills", r"(skills|technical skills|core competencies)"),
    ("Projects", r"(projects|selected projects)"),
    ("Summary", r"(summary|objective|profile)"),
]

def split_sections(full_text: str):
    lines = full_text.splitlines()
    indexes = []
    for i, line in enumerate(lines):
        lowered = line.strip().lower()
        for name, pat in HEADERS:
            if re.search(rf"\b{pat}\b", lowered):
                indexes.append((i, name))
    indexes.sort(key=lambda x: x[0])

    sections = []
    for idx, (line_no, name) in enumerate(indexes):
        start = line_no
        end = indexes[idx+1][0] if idx+1 < len(indexes) else len(lines)
        section_text = "\n".join(lines[start:end]).strip()
        sections.append({"name": name, "text": section_text})
    if not sections:
        sections = [{"name":"General","text":full_text}]
    return sections
