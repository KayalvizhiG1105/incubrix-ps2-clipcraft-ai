import os
import pytest
from pathlib import Path
from app.config import OUTPUT_DIR
from app.engine import generate_synthetic_video, render_video
from app.models import (
    TrimOperation,
    AspectRatioOperation,
    AspectRatioType,
    ResolutionOperation,
    ResolutionType,
    TextOverlayOperation,
    TextPositionType,
    MuteAudioOperation
)

@pytest.fixture(scope="module")
def base_test_video():
    """Create a 6.0 second synthetic 1280x720 video with audio for testing."""
    test_video_path = OUTPUT_DIR / "fixture_test_input.mp4"
    meta = generate_synthetic_video(test_video_path, duration=6.0, width=1280, height=720, with_audio=True)
    yield test_video_path, meta
    if test_video_path.exists():
        try:
            test_video_path.unlink()
        except Exception:
            pass

def test_generate_synthetic_video(base_test_video):
    test_path, meta = base_test_video
    assert test_path.exists()
    assert meta.width == 1280
    assert meta.height == 720
    assert abs(meta.duration - 6.0) <= 0.5
    assert meta.has_audio is True

def test_real_trim_operation(base_test_video):
    test_path, _ = base_test_video
    out_path = OUTPUT_DIR / "test_out_trim.mp4"
    op = TrimOperation(start_seconds=1.0, end_seconds=4.0)
    
    out_meta, elapsed_ms = render_video(test_path, out_path, [op])
    assert out_path.exists()
    assert abs(out_meta.duration - 3.0) <= 0.3
    assert elapsed_ms > 0
    out_path.unlink(missing_ok=True)

def test_real_aspect_ratio_9_16(base_test_video):
    test_path, _ = base_test_video
    out_path = OUTPUT_DIR / "test_out_9_16.mp4"
    op = AspectRatioOperation(target_ratio=AspectRatioType.RATIO_9_16)
    
    out_meta, _ = render_video(test_path, out_path, [op])
    assert out_path.exists()
    assert out_meta.width == 720
    assert out_meta.height == 1280
    assert out_meta.aspect_ratio == "9:16"
    out_path.unlink(missing_ok=True)

def test_real_aspect_ratio_1_1(base_test_video):
    test_path, _ = base_test_video
    out_path = OUTPUT_DIR / "test_out_1_1.mp4"
    op = AspectRatioOperation(target_ratio=AspectRatioType.RATIO_1_1)
    
    out_meta, _ = render_video(test_path, out_path, [op])
    assert out_path.exists()
    assert out_meta.width == 720
    assert out_meta.height == 720
    assert out_meta.aspect_ratio == "1:1"
    out_path.unlink(missing_ok=True)

def test_real_audio_muting(base_test_video):
    test_path, _ = base_test_video
    out_path = OUTPUT_DIR / "test_out_mute.mp4"
    op = MuteAudioOperation(mute=True)
    
    out_meta, _ = render_video(test_path, out_path, [op])
    assert out_path.exists()
    assert out_meta.has_audio is False
    assert out_meta.audio_codec is None
    out_path.unlink(missing_ok=True)

def test_real_text_overlay(base_test_video):
    test_path, _ = base_test_video
    out_path = OUTPUT_DIR / "test_out_text.mp4"
    op = TextOverlayOperation(text="Hello ClipCraft", position=TextPositionType.TOP, start_seconds=0.0, duration_seconds=3.0)
    
    out_meta, _ = render_video(test_path, out_path, [op])
    assert out_path.exists()
    assert out_meta.duration > 0
    out_path.unlink(missing_ok=True)

def test_combined_real_pipeline(base_test_video):
    test_path, _ = base_test_video
    out_path = OUTPUT_DIR / "test_out_combined.mp4"
    ops = [
        TrimOperation(start_seconds=0.0, end_seconds=3.0),
        AspectRatioOperation(target_ratio=AspectRatioType.RATIO_9_16),
        TextOverlayOperation(text="Reels Promo", position=TextPositionType.BOTTOM),
        MuteAudioOperation(mute=True)
    ]
    
    out_meta, elapsed_ms = render_video(test_path, out_path, ops)
    assert out_path.exists()
    assert abs(out_meta.duration - 3.0) <= 0.3
    assert out_meta.width == 720
    assert out_meta.height == 1280
    assert out_meta.has_audio is False
    assert elapsed_ms > 0
    out_path.unlink(missing_ok=True)
