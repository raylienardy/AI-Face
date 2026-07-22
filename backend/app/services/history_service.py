import uuid
import json
from datetime import datetime, timezone
from app.database import get_connection

class HistoryService:
    """Layanan untuk mengelola riwayat analisis."""
    
    def create(self, image_path, report, model_version, preprocessing_version):
        """Simpan analisis baru ke database. Return analysis_id."""
        analysis_id = uuid.uuid4().hex
        timestamp = datetime.now(timezone.utc).isoformat()
        
        # Serialize report
        report_dict = report.model_dump()  # Pydantic V2
        report_json = json.dumps(report_dict)
        
        overall_score = report.overall.value
        confidence = report.overall.confidence
        strengths = json.dumps(report.strengths)
        suggestions = json.dumps(report.suggestions)
        
        conn = get_connection()
        conn.execute('''
            INSERT INTO analyses (id, timestamp, image_path, report_json,
                                  overall_score, confidence, model_version,
                                  preprocessing_version, strengths, suggestions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (analysis_id, timestamp, image_path, report_json,
              overall_score, confidence, model_version,
              preprocessing_version, strengths, suggestions))
        conn.commit()
        conn.close()
        return analysis_id

    def get_all(self, limit=50):
        """Ambil semua riwayat, diurutkan dari terbaru."""
        conn = get_connection()
        rows = conn.execute(
            'SELECT id, timestamp, overall_score, confidence, strengths FROM analyses ORDER BY timestamp DESC LIMIT ?',
            (limit,)
        ).fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def get_by_id(self, analysis_id):
        """Ambil satu riwayat berdasarkan ID."""
        conn = get_connection()
        row = conn.execute('SELECT * FROM analyses WHERE id = ?', (analysis_id,)).fetchone()
        conn.close()
        return dict(row) if row else None

    def delete(self, analysis_id):
        """Hapus riwayat berdasarkan ID. Gambar tidak dihapus."""
        conn = get_connection()
        conn.execute('DELETE FROM analyses WHERE id = ?', (analysis_id,))
        conn.commit()
        affected = conn.total_changes
        conn.close()
        return affected > 0

    def search(self, query, limit=20):
        """Pencarian sederhana berdasarkan strengths/suggestions (LIKE)."""
        conn = get_connection()
        rows = conn.execute(
            'SELECT id, timestamp, overall_score, confidence FROM analyses WHERE strengths LIKE ? OR suggestions LIKE ? ORDER BY timestamp DESC LIMIT ?',
            (f'%{query}%', f'%{query}%', limit)
        ).fetchall()
        conn.close()
        return [dict(row) for row in rows]