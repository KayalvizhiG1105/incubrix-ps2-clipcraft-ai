import json
import subprocess
from pathlib import Path
from typing import Optional
from app.config import FFPROBE_PATH
from app.models import MediaMetadata

def extract_metadata(file_path: Path) -> MediaMetadata:
    """
    Extract comprehensive video and audio metadata using ffprobe.
    Raises ValueError or RuntimeError if the file is invalid or cannot be read.
    """
    if not file_path.exists():
        raise FileNotFoundError(f"Media file not found: {file_path}")

    cmd = [
        FFPROBE_PATH,
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        str(file_path)
    ]

    try:
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=30,
            check=True
        )
    except subprocess.TimeoutExpired:
        raise RuntimeError("Metadata extraction timed out.")
    except subprocess.CalledProcessError as e:
        raise ValueError(f"Failed to probe media file. Is it a valid video? Error: {e.stderr.strip()}")
    except Exception as e:
        raise RuntimeError(f"Unexpected error running ffprobe: {str(e)}")

    try:
        probe_data = json.loads(result.stdout)
    except json.JSONDecodeError:
        raise ValueError("Invalid probe output from ffprobe.")

    format_data = probe_data.get("format", {})
    streams = probe_data.get("streams", [])

    video_stream = None
    audio_stream = None

    for s in streams:
        if s.get("codec_type") == "video" and video_stream is None:
            video_stream = s
        elif s.get("codec_type") == "audio" and audio_stream is None:
            audio_stream = s

    if not video_stream:
        raise ValueError("No video stream found in media file.")

    # Extract dimensions
    width = int(video_stream.get("width", 0))
    height = int(video_stream.get("height", 0))

    # Calculate aspect ratio
    aspect_ratio = "unknown"
    if width > 0 and height > 0:
        # Check standard ratios
        ratio_val = width / height
        if abs(ratio_val - (16 / 9)) < 0.05:
            aspect_ratio = "16:9"
        elif abs(ratio_val - (9 / 16)) < 0.05:
            aspect_ratio = "9:16"
        elif abs(ratio_val - 1.0) < 0.05:
            aspect_ratio = "1:1"
        elif abs(ratio_val - (4 / 3)) < 0.05:
            aspect_ratio = "4:3"
        else:
            aspect_ratio = f"{width}:{height}"

    # Extract duration (try format first, then stream)
    duration = 0.0
    if "duration" in format_data:
        duration = float(format_data["duration"])
    elif "duration" in video_stream:
        duration = float(video_stream["duration"])

    # Extract FPS
    fps = 30.0
    r_frame_rate = video_stream.get("r_frame_rate", "30/1")
    if "/" in r_frame_rate:
        num, denom = r_frame_rate.split("/")
        if float(denom) > 0:
            fps = round(float(num) / float(denom), 2)
    elif r_frame_rate:
        fps = round(float(r_frame_rate), 2)

    # Size & Bitrate
    size_bytes = int(format_data.get("size", file_path.stat().st_size if file_path.exists() else 0))
    bitrate = int(format_data.get("bit_rate", 0)) if "bit_rate" in format_data else None

    return MediaMetadata(
        filename=file_path.name,
        format_name=format_data.get("format_name", "unknown"),
        duration=round(duration, 2),
        width=width,
        height=height,
        aspect_ratio=aspect_ratio,
        video_codec=video_stream.get("codec_name", "unknown"),
        audio_codec=audio_stream.get("codec_name") if audio_stream else None,
        has_audio=audio_stream is not None,
        fps=fps,
        size_bytes=size_bytes,
        bitrate=bitrate
    )
