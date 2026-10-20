import re
from typing import List, Tuple, Optional
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
    ParsePromptResponse,
    FitStrategyType
)

ACCEPTED_EXAMPLES = [
    "Trim the video to the first 15 seconds.",
    "Resize the video to vertical 9:16 for Reels.",
    "Convert the video to square 1:1 format.",
    "Mute the original audio.",
    'Add the title "My Travel Story" at the beginning.',
    "Trim to 20 seconds, resize to 9:16, and mute the audio.",
    "Export the video at 720p resolution.",
    'Trim from 5s to 25s, add text "Summer Vibes" at the bottom, and export at 1080p.'
]

# Patterns for unsupported keywords - MUST use word boundaries \b
KNOWN_UNSUPPORTED_PATTERNS = [
    (r"\b(music|soundtrack|song|bgm)\b", "Adding custom background music or soundtrack"),
    (r"\b(audio track|extra audio)\b", "Adding secondary audio tracks (only muting is supported)"),
    (r"\b(speed|speed up|speedup|fast forward)\b", "Speed ramping / fast forward"),
    (r"\b(slow motion|slowmo|slow-mo)\b", "Slow motion effects"),
    (r"\b(timelapse|time-lapse)\b", "Timelapse effects"),
    (r"\b(transition|transitions|crossfade|wipe)\b", "Video transition effects"),
    (r"\b(filter|filters|vintage|sepia)\b", "Color grading or visual filters"),
    (r"\b(color grade|color grading|grade)\b", "Color grading"),
    (r"\b(lut|luts)\b", "Applying 3D LUTs"),
    (r"\b(face|faces|face detection|tracking)\b", "Face detection or tracking"),
    (r"\b(subtitles auto|autocaption|auto caption)\b", "Automated speech-to-text subtitling"),
    (r"\b(green screen|chroma|chroma key)\b", "Chroma key / green screen removal"),
    (r"\b(stabilize|stabilization|stabiliser)\b", "Video stabilization"),
    (r"\b(cinematic)\b", "Abstract cinematic styling (please specify concrete trim, ratio, or overlay edits)"),
    (r"\b(ai voice|voiceover|tts)\b", "AI voiceover generation"),
    (r"\b(zoom in|pan and zoom|ken burns)\b", "Dynamic pan and zoom / Ken Burns effect"),
    (r"\b(blur background|portrait mode)\b", "Automated subject segmentation blur")
]

def parse_time_str(val: str) -> Optional[float]:
    """Parse time string like '15', '15s', '15.5', '00:15', '01:30' into seconds."""
    val = val.strip().lower()
    if val.endswith("s") or val.endswith("sec") or val.endswith("seconds"):
        val = re.sub(r"[a-z]+$", "", val).strip()
    
    if ":" in val:
        parts = val.split(":")
        try:
            if len(parts) == 2:
                m, s = float(parts[0]), float(parts[1])
                return m * 60 + s
            elif len(parts) == 3:
                h, m, s = float(parts[0]), float(parts[1]), float(parts[2])
                return h * 3600 + m * 60 + s
        except ValueError:
            return None
    try:
        return float(val)
    except ValueError:
        return None

def _mask_quotes(text: str) -> Tuple[str, List[str]]:
    """Replace quoted strings with placeholders so titles don't trigger keyword matches."""
    quotes = []
    def repl(m):
        quotes.append(m.group(1))
        return f"__QUOTED_TEXT_{len(quotes)-1}__"
    
    masked = re.sub(r'["\']([^"\']+)["\']', repl, text)
    return masked, quotes

def parse_prompt(prompt: str, video_duration: Optional[float] = None) -> ParsePromptResponse:
    prompt_clean = prompt.strip()
    if not prompt_clean:
        return ParsePromptResponse(
            success=False,
            prompt=prompt,
            operations=[],
            explanations=[],
            unsupported_intents=[],
            error="Prompt cannot be empty. Please provide an editing instruction.",
            accepted_examples=ACCEPTED_EXAMPLES
        )

    # Mask quoted text so words like "Story", "Music", "Resolution" inside titles don't false trigger
    masked_text, extracted_quotes = _mask_quotes(prompt_clean)
    lower_masked = masked_text.lower()

    operations: List[Operation] = []
    explanations: List[str] = []
    unsupported_intents: List[str] = []

    # Check for known unsupported features in non-quoted text
    for pattern, description in KNOWN_UNSUPPORTED_PATTERNS:
        if re.search(pattern, lower_masked):
            unsupported_intents.append(description)

    # 1. Parse Trim Operation
    trim_op, trim_expl = _parse_trim(lower_masked, video_duration)
    if trim_op:
        operations.append(trim_op)
        explanations.append(trim_expl)

    # 2. Parse Aspect Ratio Operation
    aspect_op, aspect_expl = _parse_aspect_ratio(lower_masked)
    if aspect_op:
        operations.append(aspect_op)
        explanations.append(aspect_expl)

    # 3. Parse Resolution Operation
    res_op, res_expl = _parse_resolution(lower_masked)
    if res_op:
        operations.append(res_op)
        explanations.append(res_expl)

    # 4. Parse Mute Audio Operation
    audio_op, audio_expl = _parse_mute(lower_masked)
    if audio_op:
        operations.append(audio_op)
        explanations.append(audio_expl)

    # 5. Parse Text Overlay Operation (check original prompt and extracted quotes)
    text_op, text_expl = _parse_text_overlay(prompt_clean, lower_masked, extracted_quotes)
    if text_op:
        operations.append(text_op)
        explanations.append(text_expl)

    # If unsupported intents were found
    if unsupported_intents:
        reasons = "; ".join(unsupported_intents)
        return ParsePromptResponse(
            success=False,
            prompt=prompt,
            operations=operations,
            explanations=explanations,
            unsupported_intents=unsupported_intents,
            error=f"Unsupported request detected: {reasons}. ClipCraft AI currently supports: Trim, Aspect Ratio (16:9, 9:16, 1:1), Resolution (720p, 1080p, 480p), Mute Audio, and Text Overlays.",
            accepted_examples=ACCEPTED_EXAMPLES
        )

    # If no valid operation was detected
    if not operations:
        return ParsePromptResponse(
            success=False,
            prompt=prompt,
            operations=[],
            explanations=[],
            unsupported_intents=["Unrecognized editing instruction"],
            error="Could not interpret any supported video editing operation from your prompt. Please review the accepted examples.",
            accepted_examples=ACCEPTED_EXAMPLES
        )

    return ParsePromptResponse(
        success=True,
        prompt=prompt,
        operations=operations,
        explanations=explanations,
        unsupported_intents=[],
        error=None,
        accepted_examples=ACCEPTED_EXAMPLES
    )

def _parse_trim(lower: str, video_duration: Optional[float]) -> Tuple[Optional[TrimOperation], str]:
    # Pattern 1: "trim from X to Y" / "cut between X and Y" / "from X to Y"
    p1 = re.search(r'(?:trim|cut|clip|keep)\s+(?:from|between)\s+([0-9:.]+s?)\s+(?:to|and|-)\s+([0-9:.]+s?)', lower)
    if p1:
        start = parse_time_str(p1.group(1))
        end = parse_time_str(p1.group(2))
        if start is not None and end is not None and end > start:
            dur = end - start
            return TrimOperation(start_seconds=start, end_seconds=end, duration=dur), f"Trim video from {start}s to {end}s ({dur}s duration)"

    # Pattern 2: "trim to the first X seconds" / "trim to X seconds" / "first X seconds" / "cut to X seconds"
    p2 = re.search(r'(?:trim|cut|clip|keep|limit|shorten)?\s*(?:the\s+)?(?:video\s+)?(?:to\s+(?:the\s+)?)?(?:first\s+)?([0-9:.]+)\s*(?:s|sec|secs|seconds|second)', lower)
    if p2:
        val_str = p2.group(1)
        # Avoid matching resolution numbers like 720p or 1080p
        if not re.search(rf'{val_str}p', lower):
            seconds = parse_time_str(val_str)
            if seconds and seconds > 0:
                return TrimOperation(start_seconds=0.0, end_seconds=seconds, duration=seconds), f"Trim video to first {seconds} seconds"

    # Pattern 3: "trim X seconds" / "cut X seconds"
    p3 = re.search(r'(?:trim|cut|keep)\s+([0-9:.]+)\s*(?:s|sec|secs|seconds)', lower)
    if p3:
        seconds = parse_time_str(p3.group(1))
        if seconds and seconds > 0:
            return TrimOperation(start_seconds=0.0, end_seconds=seconds, duration=seconds), f"Trim video to first {seconds} seconds"

    return None, ""

def _parse_aspect_ratio(lower: str) -> Tuple[Optional[AspectRatioOperation], str]:
    # 9:16 (vertical, reels, tiktok, shorts, 9:16)
    if re.search(r'\b(9:16|9/16|vertical|reels|tiktok|shorts|ig\s+story|story\s+format)\b', lower):
        crop_req = "crop" in lower
        strategy = FitStrategyType.CROP if crop_req else FitStrategyType.PAD
        desc = "Crop to 9:16 vertical" if crop_req else "Fit to vertical 9:16 (Reels/Shorts) with padding"
        return AspectRatioOperation(target_ratio=AspectRatioType.RATIO_9_16, fit_strategy=strategy), desc

    # 1:1 (square, instagram post)
    if re.search(r'\b(1:1|square|instagram\s+post|feed\s+post)\b', lower):
        crop_req = "crop" in lower
        strategy = FitStrategyType.CROP if crop_req else FitStrategyType.PAD
        desc = "Crop to 1:1 square" if crop_req else "Fit to square 1:1 format with padding"
        return AspectRatioOperation(target_ratio=AspectRatioType.RATIO_1_1, fit_strategy=strategy), desc

    # 16:9 (horizontal, landscape, widescreen, youtube)
    if re.search(r'\b(16:9|16/9|horizontal|landscape|widescreen|standard\s+ratio)\b', lower):
        crop_req = "crop" in lower
        strategy = FitStrategyType.CROP if crop_req else FitStrategyType.PAD
        desc = "Crop to 16:9 landscape" if crop_req else "Fit to landscape 16:9 widescreen format"
        return AspectRatioOperation(target_ratio=AspectRatioType.RATIO_16_9, fit_strategy=strategy), desc

    return None, ""

def _parse_resolution(lower: str) -> Tuple[Optional[ResolutionOperation], str]:
    if re.search(r'\b(720p|720\s*p|standard\s+hd)\b', lower):
        return ResolutionOperation(target_resolution=ResolutionType.RES_720P), "Export at 720p HD resolution"
    if re.search(r'\b(1080p|1080\s*p|full\s+hd|fhd)\b', lower):
        return ResolutionOperation(target_resolution=ResolutionType.RES_1080P), "Export at 1080p Full HD resolution"
    if re.search(r'\b(480p|480\s*p|sd)\b', lower):
        return ResolutionOperation(target_resolution=ResolutionType.RES_480P), "Export at 480p SD resolution"
    return None, ""

def _parse_mute(lower: str) -> Tuple[Optional[MuteAudioOperation], str]:
    if re.search(r'\b(mute|muted|muting|remove\s+audio|strip\s+audio|no\s+audio|silence\s+audio|disable\s+audio|soundless)\b', lower):
        return MuteAudioOperation(mute=True), "Mute and remove original audio stream"
    return None, ""

def _parse_text_overlay(prompt: str, lower_masked: str, quotes: List[str]) -> Tuple[Optional[TextOverlayOperation], str]:
    text_content = quotes[0] if quotes else None

    # If no quotes found, try unquoted syntax: "add title My Title at the start"
    if not text_content:
        match = re.search(r'(?:add|overlay|insert)\s+(?:the\s+)?(?:title|text|caption|heading)\s+([A-Za-z0-9\s_-]+?)(?:\s+at\s+|\s+for\s+|$)', prompt, re.IGNORECASE)
        if match:
            candidate = match.group(1).strip()
            # Ignore if it is just an aspect ratio or operation word
            if candidate.lower() not in ["video", "to", "audio", "vertical", "reels"]:
                text_content = candidate

    if not text_content:
        return None, ""

    # Position
    position = TextPositionType.TOP
    if re.search(r'\b(bottom|lower|footer)\b', lower_masked):
        position = TextPositionType.BOTTOM
    elif re.search(r'\b(center|middle)\b', lower_masked):
        position = TextPositionType.CENTER
    elif re.search(r'\b(top|header|title)\b', lower_masked):
        position = TextPositionType.TOP

    # Duration & timing
    start = 0.0
    duration = 5.0
    if re.search(r'\b(beginning|start|intro)\b', lower_masked):
        start = 0.0
        duration = 5.0
    elif re.search(r'\b(entire|throughout|whole|all)\b', lower_masked):
        duration = None

    dur_match = re.search(r'for\s+([0-9.]+)\s*(?:s|sec|seconds)', lower_masked)
    if dur_match:
        d = float(dur_match.group(1))
        if d > 0:
            duration = d

    expl = f"Add title text overlay '{text_content}' at the {position.value} (start: {start}s, duration: {duration if duration else 'full'}s)"
    return TextOverlayOperation(
        text=text_content,
        position=position,
        start_seconds=start,
        duration_seconds=duration,
        font_size=36,
        font_color="white"
    ), expl
