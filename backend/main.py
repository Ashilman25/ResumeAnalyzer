from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import analyze, draft

app = FastAPI(title="Resume AI MVP")

origins = [
    "https://pdfresumeanalyzer.ai",
    "https://resumeanalyzer-81f9c.web.app",
    "https://resumeanalyzer-81f9c.firebaseapp.com",
    "http://localhost:5173", "http://localhost:5500", "http://127.0.0.1:5500"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/health")
def api_health():
    return {"status": "ok"}

app.include_router(analyze.router, prefix="/api")
app.include_router(draft.router,  prefix="/api")