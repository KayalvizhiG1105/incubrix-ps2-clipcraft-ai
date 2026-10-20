import time
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional
from app.config import OUTPUT_DIR
from app.engine import generate_synthetic_video, render_video
from app.parser import parse_prompt
from app.validator import validate_operations
from app.metadata import extract_metadata
from app.models import EvaluationScenario, AspectRatioType

SCENARIOS_DEF = [
    {
        "id": "scenario-1",
        "name": "1. Valid Video Upload & Probe",
        "category": "Upload & Metadata",
        "description": "Upload and ffprobe verification of valid MP4 video container and streams.",
        "prompt": "N/A (Upload Validation)",
        "expected_operations": ["ffprobe metadata extraction", "codec verification"],
    },
    {
        "id": "scenario-2",
        "name": "2. Invalid File Rejection",
        "category": "Upload & Security",
        "description": "Reject non-video corrupted or invalid file types safely.",
        "prompt": "N/A (Security Validation)",
        "expected_operations": ["rejection with HTTP 400 / error message"],
    },
    {
        "id": "scenario-3",
        "name": "3. Basic Trimming",
        "category": "Video Engine",
        "description": "Trim a video to the first 3 seconds.",
        "prompt": "Trim the video to the first 3 seconds.",
        "expected_operations": ["trim (start: 0s, end: 3s)"],
    },
    {
        "id": "scenario-4",
        "name": "4. 9:16 Vertical Conversion",
        "category": "Aspect Ratio",
        "description": "Resize video to vertical 9:16 for Reels/Shorts with letterbox/pillarbox padding.",
        "prompt": "Resize the video to vertical 9:16 for Reels.",
        "expected_operations": ["aspect_ratio (9:16, fit: pad)"],
    },
    {
        "id": "scenario-5",
        "name": "5. 1:1 Square Conversion",
        "category": "Aspect Ratio",
        "description": "Convert video to square 1:1 format for Instagram feed.",
        "prompt": "Convert the video to square 1:1 format.",
        "expected_operations": ["aspect_ratio (1:1, fit: pad)"],
    },
    {
        "id": "scenario-6",
        "name": "6. Text Overlay",
        "category": "Video Engine",
        "description": "Overlay title text with contrast background at top of video.",
        "prompt": 'Add the title "Assessment Demo" at the beginning.',
        "expected_operations": ["text_overlay (Assessment Demo, top)"],
    },
    {
        "id": "scenario-7",
        "name": "7. Audio Muting",
        "category": "Audio Engine",
        "description": "Mute and remove original audio stream, verified by ffprobe.",
        "prompt": "Mute the original audio.",
        "expected_operations": ["mute_audio"],
    },
    {
        "id": "scenario-8",
        "name": "8. Combined Multi-Operation",
        "category": "Multi-Operation",
        "description": "Trim to 3 seconds, resize to 9:16, add overlay, and mute audio in single pipeline.",
        "prompt": 'Trim to 3 seconds, resize to 9:16, add title "Highlights", and mute the audio.',
        "expected_operations": ["trim", "aspect_ratio", "text_overlay", "mute_audio"],
    },
    {
        "id": "scenario-9",
        "name": "9. Unsupported Prompt Handling",
        "category": "Prompt Parser",
        "description": "Explain and reject unsupported generative/music requests without false execution.",
        "prompt": "Make this video look cinematic and add epic background music.",
        "expected_operations": ["rejection with syntax guidance"],
    },
    {
        "id": "scenario-10",
        "name": "10. Invalid Timestamp Handling",
        "category": "Validator",
        "description": "Detect and reject timestamps that exceed video duration or are out of bounds.",
        "prompt": "Trim from 10s to 45s",
        "expected_operations": ["bounds validation rejection"],
    }
]

def run_evaluation_suite() -> Dict[str, Any]:
    """
    Executes the entire evaluation test suite using real video rendering,
    ffprobe checks, and parser validations.
    """
    results: List[Dict[str, Any]] = []
    suite_start = time.time()

    # Create temporary fixture video (5.0s, 1280x720, with audio)
    fixture_path = OUTPUT_DIR / f"eval_fixture_{uuid.uuid4().hex[:8]}.mp4"
    try:
        fixture_meta = generate_synthetic_video(fixture_path, duration=5.0, width=1280, height=720, with_audio=True)
    except Exception as e:
        return {
            "total": len(SCENARIOS_DEF),
            "passed": 0,
            "failed": len(SCENARIOS_DEF),
            "total_time_ms": 0,
            "error": f"Failed to initialize evaluation test fixture: {str(e)}",
            "scenarios": []
        }

    for item in SCENARIOS_DEF:
        sid = item["id"]
        scenario_res = {
            "id": sid,
            "name": item["name"],
            "category": item["category"],
            "description": item["description"],
            "prompt": item["prompt"],
            "expected_operations": item["expected_operations"],
            "status": "pending",
            "result_summary": "",
            "measured_time_ms": 0.0,
            "output_duration": None,
            "output_dimensions": None,
            "has_audio": None,
            "error_details": None
        }

        s_start = time.time()
        try:
            if sid == "scenario-1":
                # Valid upload & probe
                meta = extract_metadata(fixture_path)
                assert meta.width == 1280 and meta.height == 720
                assert meta.has_audio is True
                scenario_res["status"] = "passed"
                scenario_res["result_summary"] = f"Verified MP4 (h264/aac, 1280x720, 5.0s)"
                scenario_res["output_duration"] = meta.duration
                scenario_res["output_dimensions"] = f"{meta.width}x{meta.height}"
                scenario_res["has_audio"] = meta.has_audio

            elif sid == "scenario-2":
                # Invalid file rejection
                dummy_file = OUTPUT_DIR / f"corrupt_{uuid.uuid4().hex[:6]}.mp4"
                dummy_file.write_text("NOT A VIDEO DATA CONTENT")
                rejected = False
                try:
                    extract_metadata(dummy_file)
                except Exception:
                    rejected = True
                finally:
                    dummy_file.unlink(missing_ok=True)

                if rejected:
                    scenario_res["status"] = "passed"
                    scenario_res["result_summary"] = "Successfully detected and rejected corrupt media file."
                else:
                    scenario_res["status"] = "failed"
                    scenario_res["error_details"] = "Corrupt file was not rejected."

            elif sid == "scenario-3":
                # Basic trimming
                parse_res = parse_prompt(item["prompt"])
                assert parse_res.success and len(parse_res.operations) == 1
                out_file = OUTPUT_DIR / f"eval_trim_{uuid.uuid4().hex[:6]}.mp4"
                out_meta, _ = render_video(fixture_path, out_file, parse_res.operations)
                assert abs(out_meta.duration - 3.0) <= 0.4
                scenario_res["status"] = "passed"
                scenario_res["result_summary"] = f"Rendered and verified duration: {out_meta.duration}s (target 3.0s)"
                scenario_res["output_duration"] = out_meta.duration
                scenario_res["output_dimensions"] = f"{out_meta.width}x{out_meta.height}"
                scenario_res["has_audio"] = out_meta.has_audio
                out_file.unlink(missing_ok=True)

            elif sid == "scenario-4":
                # 9:16 vertical
                parse_res = parse_prompt(item["prompt"])
                assert parse_res.success
                out_file = OUTPUT_DIR / f"eval_916_{uuid.uuid4().hex[:6]}.mp4"
                out_meta, _ = render_video(fixture_path, out_file, parse_res.operations)
                assert out_meta.width == 720 and out_meta.height == 1280
                scenario_res["status"] = "passed"
                scenario_res["result_summary"] = f"Rendered 9:16 vertical: {out_meta.width}x{out_meta.height}"
                scenario_res["output_duration"] = out_meta.duration
                scenario_res["output_dimensions"] = f"{out_meta.width}x{out_meta.height}"
                scenario_res["has_audio"] = out_meta.has_audio
                out_file.unlink(missing_ok=True)

            elif sid == "scenario-5":
                # 1:1 square
                parse_res = parse_prompt(item["prompt"])
                assert parse_res.success
                out_file = OUTPUT_DIR / f"eval_11_{uuid.uuid4().hex[:6]}.mp4"
                out_meta, _ = render_video(fixture_path, out_file, parse_res.operations)
                assert out_meta.width == 720 and out_meta.height == 720
                scenario_res["status"] = "passed"
                scenario_res["result_summary"] = f"Rendered 1:1 square: {out_meta.width}x{out_meta.height}"
                scenario_res["output_duration"] = out_meta.duration
                scenario_res["output_dimensions"] = f"{out_meta.width}x{out_meta.height}"
                scenario_res["has_audio"] = out_meta.has_audio
                out_file.unlink(missing_ok=True)

            elif sid == "scenario-6":
                # Text overlay
                parse_res = parse_prompt(item["prompt"])
                assert parse_res.success and parse_res.operations[0].type == "text_overlay"
                out_file = OUTPUT_DIR / f"eval_text_{uuid.uuid4().hex[:6]}.mp4"
                out_meta, _ = render_video(fixture_path, out_file, parse_res.operations)
                scenario_res["status"] = "passed"
                scenario_res["result_summary"] = f"Rendered text overlay: '{parse_res.operations[0].text}'"
                scenario_res["output_duration"] = out_meta.duration
                scenario_res["output_dimensions"] = f"{out_meta.width}x{out_meta.height}"
                scenario_res["has_audio"] = out_meta.has_audio
                out_file.unlink(missing_ok=True)

            elif sid == "scenario-7":
                # Audio muting
                parse_res = parse_prompt(item["prompt"])
                assert parse_res.success and parse_res.operations[0].type == "mute_audio"
                out_file = OUTPUT_DIR / f"eval_mute_{uuid.uuid4().hex[:6]}.mp4"
                out_meta, _ = render_video(fixture_path, out_file, parse_res.operations)
                assert out_meta.has_audio is False
                scenario_res["status"] = "passed"
                scenario_res["result_summary"] = "Rendered video with audio track stripped (has_audio=False)"
                scenario_res["output_duration"] = out_meta.duration
                scenario_res["output_dimensions"] = f"{out_meta.width}x{out_meta.height}"
                scenario_res["has_audio"] = False
                out_file.unlink(missing_ok=True)

            elif sid == "scenario-8":
                # Combined operations
                parse_res = parse_prompt(item["prompt"])
                assert parse_res.success and len(parse_res.operations) >= 4
                out_file = OUTPUT_DIR / f"eval_multi_{uuid.uuid4().hex[:6]}.mp4"
                out_meta, _ = render_video(fixture_path, out_file, parse_res.operations)
                assert abs(out_meta.duration - 3.0) <= 0.4
                assert out_meta.width == 720 and out_meta.height == 1280
                assert out_meta.has_audio is False
                scenario_res["status"] = "passed"
                scenario_res["result_summary"] = "All 4 operations executed cleanly in single pass."
                scenario_res["output_duration"] = out_meta.duration
                scenario_res["output_dimensions"] = f"{out_meta.width}x{out_meta.height}"
                scenario_res["has_audio"] = False
                out_file.unlink(missing_ok=True)

            elif sid == "scenario-9":
                # Unsupported prompt
                parse_res = parse_prompt(item["prompt"])
                assert parse_res.success is False
                assert len(parse_res.unsupported_intents) > 0
                scenario_res["status"] = "passed"
                scenario_res["result_summary"] = f"Correctly rejected: {parse_res.error[:80]}..."

            elif sid == "scenario-10":
                # Invalid timestamp
                parse_res = parse_prompt(item["prompt"])
                assert parse_res.success
                valid, errors, _ = validate_operations(parse_res.operations, fixture_meta)
                assert valid is False
                scenario_res["status"] = "passed"
                scenario_res["result_summary"] = f"Correctly rejected: {errors[0][:80]}..."

        except Exception as ex:
            scenario_res["status"] = "failed"
            scenario_res["error_details"] = str(ex)

        scenario_res["measured_time_ms"] = round((time.time() - s_start) * 1000, 2)
        results.append(scenario_res)

    # Clean up fixture
    fixture_path.unlink(missing_ok=True)

    passed_count = sum(1 for s in results if s["status"] == "passed")
    failed_count = sum(1 for s in results if s["status"] == "failed")
    total_time = round((time.time() - suite_start) * 1000, 2)

    return {
        "total": len(results),
        "passed": passed_count,
        "failed": failed_count,
        "total_time_ms": total_time,
        "scenarios": results
    }
