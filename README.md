# Resume AI MVP

A minimal, end-to-end prototype: upload a PDF résumé, score each section with AI, and show an improved draft side-by-side.

## Quick Start

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r ../requirements.txt
cp .env.example .env  # add your real OpenAI key
uvicorn main:app --reload
```

### 2. Frontend (static)

Serve the `frontend/` folder with any static server (VSCode Live Server, `python -m http.server`, etc.).

```bash
cd frontend
python -m http.server 5500
# open http://localhost:5500
```

### 3. Test the Flow

1. Open the frontend in your browser.
2. Drag/drop a PDF and select an industry.
3. Click **Analyze** – you'll get stubbed or real AI JSON back (depending on your .env).

## PDF.js Install Options

- **Bundled build**: Place prebuilt `pdf.js` & `pdf.worker.js` in `frontend/vendor/pdfjs/` (already stubbed here).
- **CDN**: See comments in `index.html`.
- **npm**: `npm install pdfjs-dist` and import it.

## Definition of Done (MVP)

- Upload ➜ Analyze ➜ Scores & Improved text shown
- Two-pane PDF viewer
- Download “Improved v1”
- Secrets in `.env`
- README reproducible on macOS

## Repo Structure

```
resume-ai-mvp/
├─ backend/
│  ├─ main.py
│  ├─ routers/
│  │  └─ analyze.py
│  ├─ services/
│  │  ├─ pdf_extract.py
│  │  ├─ section_splitter.py
│  │  └─ ai_client.py
│  ├─ models/
│  │  └─ schemas.py
│  └─ prompts/
│     ├─ section_prompt.txt
│     └─ global_prompt.txt
├─ frontend/
│  ├─ index.html
│  ├─ styles.css
│  ├─ main.js
│  ├─ pdfviewer.js
│  └─ vendor/pdfjs/ (placeholder)
├─ scripts/
│  └─ cron_cleanup.sh
├─ .env.example
├─ requirements.txt
├─ .gitignore
└─ LICENSE
```

## License

MIT (see LICENSE).

---

_Generated on 2025-07-25_
# ResumeAnalyzer
