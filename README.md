# 🧠 ResumeAnalyzer (MVP)

An interactive web app that lets you **upload a resume (PDF)**,  
get **AI-driven scores and feedback by section**, and instantly view an **improved draft** side-by-side.

---

## 🚀 What You’ll See

- **📄 Upload a PDF resume**
- **🎯 Pick a target industry** from 50+ options
- **🤖 Section-by-section scores** with strengths & improvements
- **🪄 AI-generated rewrite suggestions**
- **🪟 Two-pane viewer**: Original vs. Improved Draft
- **⬇️ Export draft** as polished PDF

---

## 🏗 Tech Behind It

### 🔹 Frontend
- **Plain HTML/CSS/JS** (no heavy frameworks)
- **PDF.js** for client-side PDF rendering
- **Custom UI** with drag-and-drop, collapsible feedback cards, and live scoring badges
- **html2pdf.js** for exporting improved drafts

### 🔹 Backend
- **FastAPI (Python)** REST API
- **pdfminer.six** for text extraction
- **Custom section splitter** for parsing resume headings
- **OpenAI GPT-4o-mini** for:
  - Per-section scoring & rewrite suggestions (async)
  - Global resume summary & recommendations (sync)

### 🔹 Hosting / Infra
- **Firebase Hosting** → frontend static assets
- **Google Cloud Run** → FastAPI backend (containerized)
- **Cloudflare** → caching & edge delivery
- **Environment secrets** via `.env` (API keys, model config)

---

## 📌 What It’s For

- **Job seekers**: get **immediate AI feedback** tailored to your industry
- **Career centers**: offer an **interactive résumé workshop tool**
- **Developers & researchers**: explore how LLMs can augment document review in real-time

This MVP demonstrates a **minimal but complete end-to-end pipeline**:  
`Upload → Extract → Analyze → Render → Rewrite → Export`.

---