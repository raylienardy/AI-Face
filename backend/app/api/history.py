import json
from logging import config
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
from app.services.history_service import HistoryService
import os

router = APIRouter(prefix="/api")

# ---------------------------------------------------------------
# Pydantic models untuk response
# ---------------------------------------------------------------
class HistoryItem(BaseModel):
    id: str
    timestamp: str
    overall_score: Optional[float] = None
    confidence: Optional[float] = None
    strengths: List[str] = []
    image_path: Optional[str] = None

class HistoryDetail(HistoryItem):
    report: dict  # JSON penuh

class HistoryList(BaseModel):
    count: int
    items: List[HistoryItem]

# ---------------------------------------------------------------
# Service instance
# ---------------------------------------------------------------
history_service = HistoryService()

# ---------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------

@router.get("/history", response_model=HistoryList)
async def get_history(limit: int = Query(50, ge=1, le=200)):
    if not config.ENABLE_HISTORY:
          return {"count": 0, "items": [], "message": "History is disabled"}
    """
    Ambil daftar riwayat analisis. Diurutkan dari yang terbaru.
    """
    records = history_service.get_all(limit=limit)
    items = []
    for rec in records:
        # Parse strengths JSON string menjadi list
        strengths = []
        try:
            strengths = json.loads(rec.get("strengths", "[]"))
        except:
            pass
        items.append(HistoryItem(
            id=rec["id"],
            timestamp=rec["timestamp"],
            overall_score=rec.get("overall_score"),
            confidence=rec.get("confidence"),
            strengths=strengths,
            image_path=rec.get("image_path")
        ))
    return HistoryList(count=len(items), items=items)

@router.get("/history/{analysis_id}", response_model=HistoryDetail)
async def get_history_detail(analysis_id: str):
    """
    Ambil detail satu riwayat, termasuk laporan lengkap.
    """
    rec = history_service.get_by_id(analysis_id)
    if not rec:
        raise HTTPException(404, "Analysis not found")
    report_dict = {}
    try:
        report_dict = json.loads(rec.get("report_json", "{}"))
    except:
        pass
    strengths = []
    try:
        strengths = json.loads(rec.get("strengths", "[]"))
    except:
        pass
    return HistoryDetail(
        id=rec["id"],
        timestamp=rec["timestamp"],
        overall_score=rec.get("overall_score"),
        confidence=rec.get("confidence"),
        strengths=strengths,
        image_path=rec.get("image_path"),
        report=report_dict
    )

@router.delete("/history/{analysis_id}")
async def delete_history(analysis_id: str):
    """
    Hapus satu riwayat analisis. Gambar tidak dihapus.
    """
    success = history_service.delete(analysis_id)
    if not success:
        raise HTTPException(404, "Analysis not found")
    return {"status": "ok", "message": f"Analysis {analysis_id} deleted"}

@router.get("/history/{analysis_id}/export")
async def export_history(analysis_id: str):
    """
    Unduh laporan analisis sebagai file JSON.
    """
    rec = history_service.get_by_id(analysis_id)
    if not rec:
        raise HTTPException(404, "Analysis not found")
    report_json = rec.get("report_json", "{}")
    # Simpan sementara ke file (atau langsung kembalikan sebagai JSON response)
    # Untuk unduhan, kita bisa kembalikan FileResponse dari file yang sudah ada,
    # atau buat file sementara. Pilihan lain: kembalikan Response dengan content JSON.
    from fastapi.responses import Response
    return Response(
        content=report_json,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=analysis_{analysis_id}.json"}
    )