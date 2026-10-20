import os
import uuid
import shutil
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Optional, List

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import (
    UPLOAD_DIR,
    OUTPUT_DIR,
    MAX_UPLOAD_SIZE_BYTES,
    ALLOWED_EXTENSIONS,
    FFMPEG_PATH,
    FFPROBE_PATH
)
from app.models import (
    ParsePromptRequest,
    ParsePromptResponse,
    RenderRequest,
    JobResponse,
    JobStatus,
    MediaMetadata
)
from app.metadata import extract_metadata
from app.parser import parse_prompt
from app.validator import validate_operations
from app.engine import render_video, generate_synthetic_video
from app.database import init_db, save_session, get_all_sessions, get_session_by_id
from app.evaluation import run_evaluation_suite

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    init_db()
    # Ensure a default sample video exists for immediate demonstration
    sample_path = UPLOAD_DIR / "sample_incubrix_demo.mp4"
    if not sample_path.exists():
        try:
            generate_synthetic_video(sample_path, duration=15.0, width=1280, height=720, with_audio=True)
        except Exception as e:
            print(f"Warning: Could not pre-generate sample video: {e}")
    yield

app = FastAPI(
    title="ClipCraft AI — Video Editing Engine API",
    description="Natural language prompt-based video editing backend for IncuBrix PS2",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Media Serving Routes -----------------

@app.get("/api/media/uploads/{filename}")
async def serve_upload(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type="video/mp4")

@app.get("/api/media/outputs/{filename}")
async def serve_output(filename: str):
    file_path = OUTPUT_DIR / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type="video/mp4")

# ----------------- API Endpoints -----------------

@app.get("/api/health")
async def health_check():
    """System health and binary tool verification."""
    ffmpeg_ok = Path(FFMPEG_PATH).exists() or shutil.which(FFMPEG_PATH) is not None
    ffprobe_ok = Path(FFPROBE_PATH).exists() or shutil.which(FFPROBE_PATH) is not None

    return {
        "status": "healthy",
        "ffmpeg": "available" if ffmpeg_ok else "missing",
        "ffprobe": "available" if ffprobe_ok else "missing",
        "ffmpeg_path": FFMPEG_PATH,
        "ffprobe_path": FFPROBE_PATH,
        "supported_codecs": ["h264", "aac"],
        "max_upload_size_mb": MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)
    }

@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    """
    Validate and store an uploaded video file, extracting metadata with ffprobe.
    """
    filename = file.filename or "uploaded_video.mp4"
    ext = Path(filename).suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    video_id = uuid.uuid4().hex
    safe_filename = f"{video_id}_{Path(filename).name}"
    save_path = UPLOAD_DIR / safe_filename

    # Read and enforce file size limit
    total_size = 0
    try:
        with open(save_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                total_size += len(chunk)
                if total_size > MAX_UPLOAD_SIZE_BYTES:
                    buffer.close()
                    save_path.unlink(missing_ok=True)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds maximum allowed size of {MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)} MB."
                    )
                buffer.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        save_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded file: {str(e)}"
        )

    # Validate and probe media
    try:
        metadata = extract_metadata(save_path)
    except ValueError as ve:
        save_path.unlink(missing_ok=True)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        save_path.unlink(missing_ok=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Probe failed: {str(e)}")

    return {
        "video_id": safe_filename,
        "original_filename": filename,
        "file_size": total_size,
        "metadata": metadata,
        "video_url": f"/api/media/uploads/{safe_filename}"
    }

@app.post("/api/sample-video")
async def load_sample_video():
    """Provides a ready-to-test sample video."""
    sample_filename = "sample_incubrix_demo.mp4"
    sample_path = UPLOAD_DIR / sample_filename
    
    if not sample_path.exists():
        generate_synthetic_video(sample_path, duration=15.0, width=1280, height=720, with_audio=True)

    metadata = extract_metadata(sample_path)
    return {
        "video_id": sample_filename,
        "original_filename": "sample_travel_clip_1080p.mp4",
        "file_size": sample_path.stat().st_size,
        "metadata": metadata,
        "video_url": f"/api/media/uploads/{sample_filename}"
    }

@app.post("/api/parse-prompt", response_model=ParsePromptResponse)
async def api_parse_prompt(req: ParsePromptRequest):
    """
    Parse natural language editing instructions into structured operations.
    """
    return parse_prompt(req.prompt, req.video_duration)

@app.post("/api/render")
async def api_render_video(req: RenderRequest):
    """
    Render video with validated operations.
    """
    input_path = UPLOAD_DIR / req.video_id
    if not input_path.exists():
        raise HTTPException(status_code=404, detail="Input video file not found. Please upload a video first.")

    session_id = uuid.uuid4().hex
    output_filename = f"out_{session_id}.mp4"
    output_path = OUTPUT_DIR / output_filename

    # Extract input metadata
    try:
        input_meta = extract_metadata(input_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot read input video: {str(e)}")

    # Validate operations against input metadata
    is_valid, validation_errors, canonical_ops = validate_operations(req.operations, input_meta)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Operation validation failed: {'; '.join(validation_errors)}"
        )

    # Save initial queued state
    save_session(
        session_id=session_id,
        video_id=req.video_id,
        project_title=req.project_title or "ClipCraft Project",
        original_filename=input_meta.filename,
        prompt=req.prompt or "",
        operations=canonical_ops,
        status=JobStatus.PROCESSING,
        input_metadata=input_meta
    )

    try:
        output_meta, elapsed_ms = render_video(input_path, output_path, canonical_ops)
        
        # Save completed state
        save_session(
            session_id=session_id,
            video_id=req.video_id,
            project_title=req.project_title or "ClipCraft Project",
            original_filename=input_meta.filename,
            prompt=req.prompt or "",
            operations=canonical_ops,
            status=JobStatus.COMPLETED,
            input_metadata=input_meta,
            output_metadata=output_meta,
            output_filename=output_filename,
            processing_time_ms=elapsed_ms
        )

        return JobResponse(
            job_id=session_id,
            video_id=req.video_id,
            project_title=req.project_title or "ClipCraft Project",
            status=JobStatus.COMPLETED,
            progress=100,
            prompt=req.prompt or "",
            operations=canonical_ops,
            original_filename=input_meta.filename,
            input_metadata=input_meta,
            output_metadata=output_meta,
            output_url=f"/api/media/outputs/{output_filename}",
            download_url=f"/api/download/{session_id}",
            processing_time_ms=elapsed_ms,
            created_at=input_meta.filename
        )

    except Exception as e:
        err_msg = str(e)
        save_session(
            session_id=session_id,
            video_id=req.video_id,
            project_title=req.project_title or "ClipCraft Project",
            original_filename=input_meta.filename,
            prompt=req.prompt or "",
            operations=canonical_ops,
            status=JobStatus.FAILED,
            input_metadata=input_meta,
            error=err_msg
        )
        raise HTTPException(status_code=500, detail=f"Render execution failed: {err_msg}")

@app.get("/api/jobs/{session_id}")
async def get_job_status(session_id: str):
    """Retrieve session or job state."""
    session = get_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@app.get("/api/history")
async def get_history():
    """Retrieve past sessions from SQLite."""
    return get_all_sessions(limit=50)

@app.get("/api/download/{session_id}")
async def download_output(session_id: str):
    """Secure file download endpoint."""
    session = get_session_by_id(session_id)
    if not session or not session.get("output_filename"):
        raise HTTPException(status_code=404, detail="Rendered file not found")

    file_path = OUTPUT_DIR / session["output_filename"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File is missing on disk")

    download_name = f"clipcraft_{session.get('project_title', 'video').replace(' ', '_').lower()}.mp4"
    return FileResponse(
        file_path,
        media_type="application/octet-stream",
        filename=download_name
    )

@app.get("/api/evaluation/run")
async def run_evaluation():
    """
    Executes the 10 assessment test scenarios with real video processing and ffprobe checks.
    """
    results = run_evaluation_suite()
    return results

# ----------------- Frontend Static Serving -----------------

FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if (FRONTEND_DIST / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    # Do not intercept /api routes
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Not Found")
    
    file_path = FRONTEND_DIST / full_path
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
    
    index_path = FRONTEND_DIST / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    
    return {"message": "ClipCraft AI API is running. Build frontend or run Vite dev server at http://localhost:5173."}

