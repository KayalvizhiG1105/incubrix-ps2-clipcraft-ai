export type AspectRatioType = "16:9" | "9:16" | "1:1";
export type ResolutionType = "480p" | "720p" | "1080p";
export type TextPositionType = "top" | "center" | "bottom";
export type FitStrategyType = "pad" | "crop";
export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface TrimOperation {
  type: "trim";
  start_seconds: number;
  end_seconds?: number;
  duration?: number;
}

export interface AspectRatioOperation {
  type: "aspect_ratio";
  target_ratio: AspectRatioType;
  fit_strategy: FitStrategyType;
}

export interface ResolutionOperation {
  type: "resolution";
  target_resolution: ResolutionType;
}

export interface TextOverlayOperation {
  type: "text_overlay";
  text: string;
  position: TextPositionType;
  start_seconds: number;
  duration_seconds?: number;
  font_size: number;
  font_color: string;
}

export interface MuteAudioOperation {
  type: "mute_audio";
  mute: boolean;
}

export type Operation =
  | TrimOperation
  | AspectRatioOperation
  | ResolutionOperation
  | TextOverlayOperation
  | MuteAudioOperation;

export interface MediaMetadata {
  filename: string;
  format_name: string;
  duration: number;
  width: number;
  height: number;
  aspect_ratio: string;
  video_codec: string;
  audio_codec?: string;
  has_audio: boolean;
  fps: number;
  size_bytes: number;
  bitrate?: number;
}

export interface ParsePromptResponse {
  success: boolean;
  prompt: string;
  operations: Operation[];
  explanations: string[];
  unsupported_intents: string[];
  error?: string;
  accepted_examples: string[];
}

export interface UploadResponse {
  video_id: string;
  original_filename: string;
  file_size: number;
  metadata: MediaMetadata;
  video_url: string;
}

export interface RenderRequest {
  video_id: string;
  project_title?: string;
  prompt?: string;
  operations: Operation[];
}

export interface JobResponse {
  job_id: string;
  video_id: string;
  project_title: string;
  status: JobStatus;
  progress: number;
  prompt: string;
  operations: Operation[];
  original_filename: string;
  input_metadata?: MediaMetadata;
  output_metadata?: MediaMetadata;
  output_url?: string;
  download_url?: string;
  processing_time_ms?: number;
  error?: string;
  created_at: string;
}

export interface SessionHistoryItem {
  session_id: string;
  video_id: string;
  project_title: string;
  original_filename: string;
  prompt: string;
  operations: Operation[];
  status: JobStatus;
  processing_time_ms?: number;
  input_metadata?: MediaMetadata;
  output_metadata?: MediaMetadata;
  output_url?: string;
  download_url?: string;
  error?: string;
  created_at: string;
  completed_at?: string;
}

export interface EvaluationScenario {
  id: string;
  name: string;
  category: string;
  description: string;
  prompt: string;
  expected_operations: string[];
  status: "passed" | "failed" | "pending" | "running";
  result_summary?: string;
  measured_time_ms?: number;
  output_duration?: number;
  output_dimensions?: string;
  has_audio?: boolean;
  error_details?: string;
}

export interface EvaluationSuiteResult {
  total: number;
  passed: number;
  failed: number;
  total_time_ms: number;
  scenarios: EvaluationScenario[];
  error?: string;
}

export type NavTab = "editor" | "history" | "evaluation" | "docs";
