from enum import Enum
from typing import List, Optional, Union, Literal
from pydantic import BaseModel, Field

class AspectRatioType(str, Enum):
    RATIO_16_9 = "16:9"
    RATIO_9_16 = "9:16"
    RATIO_1_1 = "1:1"

class ResolutionType(str, Enum):
    RES_480P = "480p"
    RES_720P = "720p"
    RES_1080P = "1080p"

class TextPositionType(str, Enum):
    TOP = "top"
    CENTER = "center"
    BOTTOM = "bottom"

class FitStrategyType(str, Enum):
    PAD = "pad"    # Letterbox / Pillarbox padding preserving original ratio
    CROP = "crop"  # Center crop to fill target aspect ratio

class JobStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

# ----------------- Editing Operations -----------------

class TrimOperation(BaseModel):
    type: Literal["trim"] = "trim"
    start_seconds: float = Field(default=0.0, ge=0.0, description="Start timestamp in seconds")
    end_seconds: Optional[float] = Field(default=None, ge=0.0, description="End timestamp in seconds")
    duration: Optional[float] = Field(default=None, gt=0.0, description="Desired segment duration in seconds")

class AspectRatioOperation(BaseModel):
    type: Literal["aspect_ratio"] = "aspect_ratio"
    target_ratio: AspectRatioType = Field(..., description="Target aspect ratio")
    fit_strategy: FitStrategyType = Field(default=FitStrategyType.PAD, description="Strategy to avoid distortion")

class ResolutionOperation(BaseModel):
    type: Literal["resolution"] = "resolution"
    target_resolution: ResolutionType = Field(..., description="Target video resolution")

class TextOverlayOperation(BaseModel):
    type: Literal["text_overlay"] = "text_overlay"
    text: str = Field(..., min_length=1, max_length=200, description="Text string to overlay")
    position: TextPositionType = Field(default=TextPositionType.TOP, description="Placement on screen")
    start_seconds: float = Field(default=0.0, ge=0.0, description="When to start showing overlay")
    duration_seconds: Optional[float] = Field(default=5.0, gt=0.0, description="Duration in seconds. None for full video")
    font_size: int = Field(default=36, ge=12, le=96, description="Font size in pt/px")
    font_color: str = Field(default="white", description="Hex or name of font color")

class MuteAudioOperation(BaseModel):
    type: Literal["mute_audio"] = "mute_audio"
    mute: bool = Field(default=True, description="Whether to mute or remove audio track")

Operation = Union[
    TrimOperation,
    AspectRatioOperation,
    ResolutionOperation,
    TextOverlayOperation,
    MuteAudioOperation
]

# ----------------- Media Metadata -----------------

class MediaMetadata(BaseModel):
    filename: str
    format_name: str
    duration: float
    width: int
    height: int
    aspect_ratio: str
    video_codec: str
    audio_codec: Optional[str] = None
    has_audio: bool = False
    fps: float = 30.0
    size_bytes: int = 0
    bitrate: Optional[int] = None

# ----------------- Request / Response Models -----------------

class ParsePromptRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=500, description="Natural language prompt")
    video_duration: Optional[float] = Field(default=None, description="Optional input video duration for bounds checking")

class ParsePromptResponse(BaseModel):
    success: bool
    prompt: str
    operations: List[Operation] = []
    explanations: List[str] = []
    unsupported_intents: List[str] = []
    error: Optional[str] = None
    accepted_examples: List[str] = []

class RenderRequest(BaseModel):
    video_id: str
    project_title: Optional[str] = "Untitled Project"
    prompt: Optional[str] = ""
    operations: List[Operation]

class JobResponse(BaseModel):
    job_id: str
    video_id: str
    project_title: str
    status: JobStatus
    progress: int = 0
    prompt: str = ""
    operations: List[Operation] = []
    original_filename: str = ""
    input_metadata: Optional[MediaMetadata] = None
    output_metadata: Optional[MediaMetadata] = None
    output_url: Optional[str] = None
    download_url: Optional[str] = None
    processing_time_ms: Optional[float] = None
    error: Optional[str] = None
    created_at: str
    completed_at: Optional[str] = None

class SessionHistoryItem(BaseModel):
    session_id: str
    video_id: str
    project_title: str
    original_filename: str
    prompt: str
    operations: List[Operation]
    status: JobStatus
    processing_time_ms: Optional[float]
    input_metadata: Optional[MediaMetadata]
    output_metadata: Optional[MediaMetadata]
    output_url: Optional[str]
    download_url: Optional[str]
    created_at: str
    completed_at: Optional[str]

class EvaluationScenario(BaseModel):
    id: str
    name: str
    category: str
    description: str
    prompt: str
    expected_operations: List[str]
    status: Literal["passed", "failed", "pending", "running"] = "pending"
    result_summary: Optional[str] = None
    measured_time_ms: Optional[float] = None
    output_duration: Optional[float] = None
    output_dimensions: Optional[str] = None
    has_audio: Optional[bool] = None
    error_details: Optional[str] = None
