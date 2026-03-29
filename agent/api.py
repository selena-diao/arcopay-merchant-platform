from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import diagnose

app = FastAPI(title="ArcoPay结算诊断Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://arcopay-merchant-platform.vercel.app",
        "http://localhost:5173",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

class DiagnoseRequest(BaseModel):
    record_id: str

@app.post("/diagnose/channel")
async def diagnose_channel(request: DiagnoseRequest):
    try:
        result = diagnose(request.record_id)
        return {"record_id": request.record_id, "diagnosis": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ok"}
