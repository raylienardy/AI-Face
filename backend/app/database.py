import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'faceai.db')

def get_connection():
    """Membuka koneksi ke database SQLite."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Inisialisasi database: buat tabel jika belum ada."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS analyses (
            id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            image_path TEXT NOT NULL,
            report_json TEXT NOT NULL,
            overall_score REAL,
            confidence REAL,
            model_version TEXT,
            preprocessing_version TEXT,
            strengths TEXT,
            suggestions TEXT,
            status TEXT DEFAULT 'completed'
        )
    ''')
    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH}")