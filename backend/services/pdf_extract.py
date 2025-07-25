from pdfminer.high_level import extract_text as pdfminer_extract_text

def extract_pdf_text(pdf_path: str) -> str:
    try:
        return pdfminer_extract_text(pdf_path)
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return ""

