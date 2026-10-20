from typing import List, Tuple, Optional
from app.models import (
    Operation,
    TrimOperation,
    AspectRatioOperation,
    ResolutionOperation,
    TextOverlayOperation,
    MuteAudioOperation,
    MediaMetadata
)

class ValidationError(Exception):
    pass

def validate_operations(operations: List[Operation], metadata: Optional[MediaMetadata] = None) -> Tuple[bool, List[str], List[Operation]]:
    """
    Validate a list of operations against constraints and optional video metadata.
    Returns: (is_valid, error_or_warning_messages, ordered_canonical_operations)
    """
    if not operations:
        return False, ["No editing operations provided."], []

    errors: List[str] = []
    warnings: List[str] = []
    
    # Canonical slots for single-instance operations
    trim_op: Optional[TrimOperation] = None
    aspect_op: Optional[AspectRatioOperation] = None
    res_op: Optional[ResolutionOperation] = None
    audio_op: Optional[MuteAudioOperation] = None
    text_ops: List[TextOverlayOperation] = []

    for op in operations:
        if op.type == "trim":
            if trim_op is not None:
                warnings.append("Multiple trim operations detected. Using the most specific trim instruction.")
            
            # Bounds checking
            if op.start_seconds < 0:
                errors.append(f"Trim start time cannot be negative: {op.start_seconds}s")
            
            if op.end_seconds is not None:
                if op.end_seconds <= op.start_seconds:
                    errors.append(f"Trim end time ({op.end_seconds}s) must be greater than start time ({op.start_seconds}s).")
                else:
                    op.duration = round(op.end_seconds - op.start_seconds, 2)

                if metadata and metadata.duration > 0 and op.end_seconds > metadata.duration:
                    errors.append(
                        f"Trim end time ({op.end_seconds}s) exceeds video duration ({metadata.duration}s). "
                        f"Please choose a timestamp within 0 - {metadata.duration}s."
                    )
            elif op.duration is not None:
                if op.duration <= 0:
                    errors.append(f"Trim duration must be positive: {op.duration}s")
                if metadata and metadata.duration > 0 and (op.start_seconds + op.duration) > metadata.duration:
                    errors.append(
                        f"Trim duration ({op.duration}s from {op.start_seconds}s) exceeds video duration ({metadata.duration}s)."
                    )
                else:
                    op.end_seconds = round(op.start_seconds + op.duration, 2)

            if metadata and metadata.duration > 0 and op.start_seconds >= metadata.duration:
                errors.append(f"Trim start time ({op.start_seconds}s) is at or beyond total video duration ({metadata.duration}s).")

            trim_op = op

        elif op.type == "aspect_ratio":
            if aspect_op is not None:
                warnings.append(f"Multiple aspect ratio operations detected. Overriding with {op.target_ratio.value}.")
            aspect_op = op

        elif op.type == "resolution":
            if res_op is not None:
                warnings.append(f"Multiple resolution operations detected. Overriding with {op.target_resolution.value}.")
            res_op = op

        elif op.type == "mute_audio":
            audio_op = op
            if metadata and not metadata.has_audio:
                warnings.append("Video already does not contain an audio track. Muting has no effect.")

        elif op.type == "text_overlay":
            if not op.text or not op.text.strip():
                errors.append("Text overlay string cannot be whitespace-only.")
            elif len(op.text) > 200:
                errors.append(f"Text overlay too long ({len(op.text)} chars). Maximum is 200 characters.")
            
            effective_duration = metadata.duration if metadata else 9999.0
            if trim_op and trim_op.end_seconds:
                effective_duration = trim_op.end_seconds - trim_op.start_seconds
            
            if op.start_seconds >= effective_duration:
                errors.append(f"Text overlay start time ({op.start_seconds}s) is beyond the active video duration ({effective_duration}s).")
            
            text_ops.append(op)

    if errors:
        return False, errors, []

    # Assemble operations in canonical execution order:
    # 1. Trim
    # 2. Aspect Ratio / Resolution
    # 3. Text Overlay
    # 4. Audio
    canonical_order: List[Operation] = []
    if trim_op:
        canonical_order.append(trim_op)
    if aspect_op:
        canonical_order.append(aspect_op)
    if res_op:
        canonical_order.append(res_op)
    canonical_order.extend(text_ops)
    if audio_op:
        canonical_order.append(audio_op)

    return True, warnings, canonical_order
