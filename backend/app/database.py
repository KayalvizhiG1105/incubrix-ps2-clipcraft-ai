import sqlite3
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.config import DB_PATH
from app.models import SessionHistoryItem, JobStatus, Operation, MediaMetadata

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            video_id TEXT NOT NULL,
            project_title TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            prompt TEXT NOT NULL,
            operations_json TEXT NOT NULL,
            status TEXT NOT NULL,
            processing_time_ms REAL,
            input_metadata_json TEXT,
            output_metadata_json TEXT,
            output_filename TEXT,
            error TEXT,
            created_at TEXT NOT NULL,
            completed_at TEXT
        )
    """)
    conn.commit()
    conn.close()

def save_session(
    session_id: str,
    video_id: str,
    project_title: str,
    original_filename: str,
    prompt: str,
    operations: List[Operation],
    status: JobStatus,
    input_metadata: Optional[MediaMetadata] = None,
    output_metadata: Optional[MediaMetadata] = None,
    output_filename: Optional[str] = None,
    processing_time_ms: Optional[float] = None,
    error: Optional[str] = None
):
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.now().isoformat()
    
    ops_serialized = json.dumps([op.model_dump() for op in operations])
    in_meta_serialized = json.dumps(input_metadata.model_dump()) if input_metadata else None
    out_meta_serialized = json.dumps(output_metadata.model_dump()) if output_metadata else None

    cursor.execute("""
        INSERT INTO sessions (
            session_id, video_id, project_title, original_filename,
            prompt, operations_json, status, processing_time_ms,
            input_metadata_json, output_metadata_json, output_filename,
            error, created_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(session_id) DO UPDATE SET
            status=excluded.status,
            processing_time_ms=excluded.processing_time_ms,
            output_metadata_json=excluded.output_metadata_json,
            output_filename=excluded.output_filename,
            error=excluded.error,
            completed_at=excluded.completed_at
    """, (
        session_id, video_id, project_title, original_filename,
        prompt, ops_serialized, status.value, processing_time_ms,
        in_meta_serialized, out_meta_serialized, output_filename,
        error, now_str, now_str if status in [JobStatus.COMPLETED, JobStatus.FAILED] else None
    ))
    conn.commit()
    conn.close()

def get_all_sessions(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM sessions ORDER BY created_at DESC LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()

    results = []
    for row in rows:
        item = dict(row)
        item["operations"] = json.loads(item["operations_json"]) if item["operations_json"] else []
        item["input_metadata"] = json.loads(item["input_metadata_json"]) if item["input_metadata_json"] else None
        item["output_metadata"] = json.loads(item["output_metadata_json"]) if item["output_metadata_json"] else None
        
        if item.get("output_filename"):
            item["output_url"] = f"/api/media/outputs/{item['output_filename']}"
            item["download_url"] = f"/api/download/{item['session_id']}"
        else:
            item["output_url"] = None
            item["download_url"] = None
        results.append(item)
    return results

def get_session_by_id(session_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sessions WHERE session_id = ?", (session_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None

    item = dict(row)
    item["operations"] = json.loads(item["operations_json"]) if item["operations_json"] else []
    item["input_metadata"] = json.loads(item["input_metadata_json"]) if item["input_metadata_json"] else None
    item["output_metadata"] = json.loads(item["output_metadata_json"]) if item["output_metadata_json"] else None
    if item.get("output_filename"):
        item["output_url"] = f"/api/media/outputs/{item['output_filename']}"
        item["download_url"] = f"/api/download/{item['session_id']}"
    else:
        item["output_url"] = None
        item["download_url"] = None
    return item
