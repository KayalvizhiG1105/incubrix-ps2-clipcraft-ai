import os
import time
import subprocess
from pathlib import Path
from typing import List, Tuple, Optional
from app.config import FFMPEG_PATH, RENDER_TIMEOUT_SECONDS
from app.models import (
    Operation,
    TrimOperation,
    AspectRatioOperation,
    AspectRatioType,
    ResolutionOperation,
    ResolutionType,
    TextOverlayOperation,
    TextPositionType,
    MuteAudioOperation,
    FitStrategyType,
    MediaMetadata
)
from app.metadata import extract_metadata
from app.validator import validate_operations

def get_target_dimensions(
    aspect_ratio: Optional[AspectRatioType],
    resolution: Optional[ResolutionType],
    input_width: int,
    input_height: int
) -> Tuple[int, int]:
    """Calculate target width and height based on aspect ratio and resolution preferences."""
    base_res = resolution.value if resolution else "720p"
    
    # Base height/width reference table
    if aspect_ratio == AspectRatioType.RATIO_9_16:
        # Vertical (Reels / Shorts)
        if base_res == "1080p":
            return (1080, 1920)
        elif base_res == "480p":
            return (480, 854)
        else: # 720p default
            return (720, 1280)

    elif aspect_ratio == AspectRatioType.RATIO_1_1:
        # Square (Instagram feed)
        if base_res == "1080p":
            return (1080, 1080)
        elif base_res == "480p":
            return (480, 480)
        else: # 720p default
            return (720, 720)

    elif aspect_ratio == AspectRatioType.RATIO_16_9:
        # Landscape
        if base_res == "1080p":
            return (1920, 1080)
        elif base_res == "480p":
            return (854, 480)
        else: # 720p default
            return (1280, 720)

    else:
        # No aspect ratio specified, but resolution specified
        if resolution:
            target_h = 720
            if base_res == "1080p":
                target_h = 1080
            elif base_res == "480p":
                target_h = 480
            
            # Keep original aspect ratio
            current_ratio = input_width / max(input_height, 1)
            target_w = int(target_h * current_ratio)
            # Ensure even dimensions for H.264
            target_w = target_w if target_w % 2 == 0 else target_w + 1
            return (target_w, target_h)
        
        # Keep original dimensions (clamped to even numbers)
        w = input_width if input_width % 2 == 0 else input_width + 1
        h = input_height if input_height % 2 == 0 else input_height + 1
        return (w, h)

def escape_drawtext(text: str) -> str:
    """Escape text string for FFmpeg drawtext filter."""
    # FFmpeg drawtext requires escaping: \, :, ', %
    text = text.replace("\\", "\\\\")
    text = text.replace("'", "'\\\\''")
    text = text.replace(":", "\\:")
    text = text.replace("%", "\\%")
    return text

def build_ffmpeg_command(
    input_path: Path,
    output_path: Path,
    operations: List[Operation],
    input_metadata: MediaMetadata
) -> List[str]:
    """Construct an argument list for FFmpeg with the requested operations."""
    cmd = [FFMPEG_PATH, "-y"]

    trim_op: Optional[TrimOperation] = None
    aspect_op: Optional[AspectRatioOperation] = None
    res_op: Optional[ResolutionOperation] = None
    audio_op: Optional[MuteAudioOperation] = None
    text_ops: List[TextOverlayOperation] = []

    for op in operations:
        if op.type == "trim":
            trim_op = op
        elif op.type == "aspect_ratio":
            aspect_op = op
        elif op.type == "resolution":
            res_op = op
        elif op.type == "mute_audio":
            audio_op = op
        elif op.type == "text_overlay":
            text_ops.append(op)

    # 1. Trimming at input level for fast seeking, combined with accurate decode
    if trim_op:
        if trim_op.start_seconds > 0:
            cmd.extend(["-ss", str(trim_op.start_seconds)])
        if trim_op.duration:
            cmd.extend(["-t", str(trim_op.duration)])
        elif trim_op.end_seconds:
            dur = trim_op.end_seconds - trim_op.start_seconds
            cmd.extend(["-t", str(dur)])

    # Input file
    cmd.extend(["-i", str(input_path)])

    # 2. Build Video Filter Graph
    video_filters: List[str] = []

    # Aspect ratio & Scaling
    if aspect_op or res_op:
        target_w, target_h = get_target_dimensions(
            aspect_op.target_ratio if aspect_op else None,
            res_op.target_resolution if res_op else None,
            input_metadata.width,
            input_metadata.height
        )

        fit = aspect_op.fit_strategy if aspect_op else FitStrategyType.PAD
        if fit == FitStrategyType.CROP:
            # Scale to fill target, then crop center
            video_filters.append(
                f"scale={target_w}:{target_h}:force_original_aspect_ratio=increase,"
                f"crop={target_w}:{target_h}"
            )
        else:
            # Pad strategy: preserve original aspect ratio, letterbox / pillarbox
            video_filters.append(
                f"scale={target_w}:{target_h}:force_original_aspect_ratio=decrease,"
                f"pad={target_w}:{target_h}:(ow-iw)/2:(oh-ih)/2:color=black"
            )

    # Text overlays
    font_file_path = "C:/Windows/Fonts/arial.ttf"
    has_font = Path(font_file_path).exists()
    font_param = f":fontfile='C\\:/Windows/Fonts/arial.ttf'" if has_font else ""

    for text_op in text_ops:
        safe_text = escape_drawtext(text_op.text)
        
        # Position calculation
        if text_op.position == TextPositionType.TOP:
            pos_expr = "x=(w-text_w)/2:y=40"
        elif text_op.position == TextPositionType.BOTTOM:
            pos_expr = "x=(w-text_w)/2:y=h-text_h-40"
        else:  # Center
            pos_expr = "x=(w-text_w)/2:y=(h-text_h)/2"

        # Timing
        time_expr = ""
        if text_op.duration_seconds:
            end_t = text_op.start_seconds + text_op.duration_seconds
            time_expr = f":enable='between(t,{text_op.start_seconds},{end_t})'"
        elif text_op.start_seconds > 0:
            time_expr = f":enable='gte(t,{text_op.start_seconds})'"

        filter_str = (
            f"drawtext=text='{safe_text}'"
            f"{font_param}"
            f":fontsize={text_op.font_size}"
            f":fontcolor={text_op.font_color}"
            f":box=1:boxcolor=black@0.6:boxborderw=8"
            f":{pos_expr}"
            f"{time_expr}"
        )
        video_filters.append(filter_str)

    if video_filters:
        cmd.extend(["-vf", ",".join(video_filters)])

    # Video codec settings (H.264 high compatibility)
    cmd.extend([
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "22",
        "-pix_fmt", "yuv420p"
    ])

    # Audio handling
    if audio_op and audio_op.mute:
        cmd.append("-an")  # Strip audio
    else:
        if input_metadata.has_audio:
            cmd.extend(["-c:a", "aac", "-b:a", "128k"])
        else:
            cmd.append("-an")

    # Faststart for web streaming & write to output
    cmd.extend(["-movflags", "+faststart", str(output_path)])

    return cmd

def render_video(
    input_path: Path,
    output_path: Path,
    operations: List[Operation]
) -> Tuple[MediaMetadata, float]:
    """
    Execute video rendering pipeline for given operations.
    Returns: (output_metadata, processing_time_ms)
    """
    if not input_path.exists():
        raise FileNotFoundError(f"Input video file not found: {input_path}")

    # 1. Extract and validate input metadata
    input_meta = extract_metadata(input_path)
    is_valid, messages, canonical_ops = validate_operations(operations, input_meta)
    if not is_valid:
        raise ValueError(f"Validation failed: {'; '.join(messages)}")

    # 2. Build FFmpeg command
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cmd = build_ffmpeg_command(input_path, output_path, canonical_ops, input_meta)

    # 3. Execute with timing
    start_time = time.time()
    try:
        process = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=RENDER_TIMEOUT_SECONDS
        )
    except subprocess.TimeoutExpired:
        raise RuntimeError(f"Rendering exceeded timeout limit of {RENDER_TIMEOUT_SECONDS} seconds.")
    except Exception as e:
        raise RuntimeError(f"FFmpeg execution failed: {str(e)}")

    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    if process.returncode != 0:
        err_msg = process.stderr.strip()
        # Extract last few meaningful lines from stderr
        lines = [l for l in err_msg.splitlines() if l.strip()]
        last_lines = "\n".join(lines[-5:]) if lines else "Unknown FFmpeg error"
        raise RuntimeError(f"FFmpeg failed with exit code {process.returncode}:\n{last_lines}")

    if not output_path.exists() or output_path.stat().st_size == 0:
        raise RuntimeError("Render failed: Output file was not generated or is empty.")

    # 4. Probe output video to verify actual properties
    output_meta = extract_metadata(output_path)
    return output_meta, elapsed_ms

def generate_synthetic_video(
    output_path: Path,
    duration: float = 5.0,
    width: int = 1280,
    height: int = 720,
    fps: int = 30,
    with_audio: bool = True
) -> MediaMetadata:
    """
    Generate a clean synthetic test video with dynamic color bars, time counter,
    and a generated audio sine wave tone. Useful for automated tests and live evaluations.
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # FFmpeg command using testsrc filter and sine audio
    cmd = [
        FFMPEG_PATH, "-y",
        "-f", "lavfi",
        "-i", f"testsrc=duration={duration}:size={width}x{height}:rate={fps}",
    ]

    if with_audio:
        cmd.extend([
            "-f", "lavfi",
            "-i", f"sine=frequency=440:duration={duration}"
        ])
        cmd.extend(["-c:a", "aac", "-b:a", "128k"])
    else:
        cmd.append("-an")

    cmd.extend([
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        str(output_path)
    ])

    result = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        timeout=60
    )

    if result.returncode != 0:
        raise RuntimeError(f"Failed to generate synthetic video: {result.stderr.strip()}")

    return extract_metadata(output_path)
