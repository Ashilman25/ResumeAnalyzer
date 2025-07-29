from pdfminer.high_level import extract_text
from pdfminer.layout import LAParams
import re

def extract_pdf_text(pdf_path: str) -> str:
    laparams = LAParams(line_margin=0.4, char_margin=2.0, word_margin=0.1)
    text = extract_text(pdf_path, laparams=laparams)
    # Light cleanup only
    text = re.sub(r'[ \t]+', ' ', text)          # collapse spaces
    text = re.sub(r'\n{3,}', '\n\n', text)       # keep blank lines
    return text

