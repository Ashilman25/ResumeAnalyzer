from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import analyze

app = FastAPI(title="Resume AI MVP")

origins = ["http://localhost:5173", "http://localhost:5500", "http://127.0.0.1:5500"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(analyze.router)
