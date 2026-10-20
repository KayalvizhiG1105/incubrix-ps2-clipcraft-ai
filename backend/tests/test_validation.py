import pytest
from app.validator import validate_operations
from app.models import (
    TrimOperation,
    AspectRatioOperation,
    AspectRatioType,
    TextOverlayOperation,
    MuteAudioOperation,
    MediaMetadata
)

@pytest.fixture
def sample_metadata():
    return MediaMetadata(
        filename="test.mp4",
        format_name="mov,mp4,m4a,3gp,3g2,mj2",
        duration=30.0,
        width=1920,
        height=1080,
        aspect_ratio="16:9",
        video_codec="h264",
        audio_codec="aac",
        has_audio=True,
        fps=30.0,
        size_bytes=1000000
    )

def test_valid_trim(sample_metadata):
    op = TrimOperation(start_seconds=5.0, end_seconds=15.0)
    valid, msgs, ordered = validate_operations([op], sample_metadata)
    assert valid is True
    assert len(ordered) == 1
    assert ordered[0].duration == 10.0

def test_invalid_trim_exceeds_duration(sample_metadata):
    op = TrimOperation(start_seconds=10.0, end_seconds=45.0)
    valid, errors, _ = validate_operations([op], sample_metadata)
    assert valid is False
    assert any("exceeds video duration" in e for e in errors)

def test_invalid_trim_inverted_timestamps():
    op = TrimOperation(start_seconds=20.0, end_seconds=10.0)
    valid, errors, _ = validate_operations([op])
    assert valid is False
    assert any("must be greater than" in e for e in errors)

def test_canonical_ordering(sample_metadata):
    # Pass operations in random order
    ops = [
        MuteAudioOperation(),
        TextOverlayOperation(text="Hello", position="top"),
        AspectRatioOperation(target_ratio=AspectRatioType.RATIO_9_16),
        TrimOperation(start_seconds=0.0, end_seconds=10.0)
    ]
    valid, _, ordered = validate_operations(ops, sample_metadata)
    assert valid is True
    # Canonical order: trim -> aspect_ratio -> text_overlay -> mute_audio
    assert [op.type for op in ordered] == ["trim", "aspect_ratio", "text_overlay", "mute_audio"]

def test_text_overlay_validation():
    # Whitespace-only string
    op = TextOverlayOperation(text="   ", position="top")
    valid, errors, _ = validate_operations([op])
    assert valid is False
    assert any("whitespace" in e for e in errors)
