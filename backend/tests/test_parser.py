import pytest
from app.parser import parse_prompt
from app.models import AspectRatioType, ResolutionType, TextPositionType

def test_trim_to_seconds():
    res = parse_prompt("Trim the video to the first 15 seconds.")
    assert res.success is True
    assert len(res.operations) == 1
    op = res.operations[0]
    assert op.type == "trim"
    assert op.start_seconds == 0.0
    assert op.end_seconds == 15.0
    assert op.duration == 15.0

def test_trim_range():
    res = parse_prompt("Trim from 5s to 20s")
    assert res.success is True
    assert len(res.operations) == 1
    op = res.operations[0]
    assert op.type == "trim"
    assert op.start_seconds == 5.0
    assert op.end_seconds == 20.0
    assert op.duration == 15.0

def test_aspect_ratio_9_16():
    res = parse_prompt("Resize the video to vertical 9:16 for Reels.")
    assert res.success is True
    assert len(res.operations) == 1
    op = res.operations[0]
    assert op.type == "aspect_ratio"
    assert op.target_ratio == AspectRatioType.RATIO_9_16
    assert op.fit_strategy == "pad"

def test_aspect_ratio_square():
    res = parse_prompt("Convert the video to square 1:1 format.")
    assert res.success is True
    assert len(res.operations) == 1
    op = res.operations[0]
    assert op.type == "aspect_ratio"
    assert op.target_ratio == AspectRatioType.RATIO_1_1

def test_mute_audio():
    res = parse_prompt("Mute the original audio.")
    assert res.success is True
    assert len(res.operations) == 1
    op = res.operations[0]
    assert op.type == "mute_audio"
    assert op.mute is True

def test_text_overlay():
    res = parse_prompt('Add the title "My Travel Story" at the beginning.')
    assert res.success is True
    assert len(res.operations) == 1
    op = res.operations[0]
    assert op.type == "text_overlay"
    assert op.text == "My Travel Story"
    assert op.position == TextPositionType.TOP
    assert op.start_seconds == 0.0

def test_export_720p():
    res = parse_prompt("Export the video at 720p resolution.")
    assert res.success is True
    assert len(res.operations) == 1
    op = res.operations[0]
    assert op.type == "resolution"
    assert op.target_resolution == ResolutionType.RES_720P

def test_combined_multi_operation():
    res = parse_prompt("Trim to 20 seconds, resize to 9:16, and mute the audio.")
    assert res.success is True
    types = [op.type for op in res.operations]
    assert "trim" in types
    assert "aspect_ratio" in types
    assert "mute_audio" in types
    assert len(res.operations) == 3

def test_unsupported_prompt():
    res = parse_prompt("Make this video look cinematic like a Hollywood film with epic music.")
    assert res.success is False
    assert len(res.unsupported_intents) > 0
    assert "music" in res.error.lower() or "cinematic" in res.error.lower()

def test_empty_prompt():
    res = parse_prompt("   ")
    assert res.success is False
    assert "empty" in res.error.lower()
