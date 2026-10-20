# ClipCraft AI — Prompt-Based Video Editing Engine
### IncuBrix Software Engineer Assessment — Problem Statement PS2

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_19_TypeScript-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![FFmpeg](https://img.shields.io/badge/Video_Engine-FFmpeg_9.0-007808.svg?logo=ffmpeg&logoColor=white)](https://ffmpeg.org)
[![Pytest](https://img.shields.io/badge/Tests-28%2F28_Passed-success.svg?logo=pytest&logoColor=white)](https://pytest.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

ClipCraft AI is a complete, full-stack video editing platform where users upload videos, describe edits in natural language prompts, review interpreted operation plans, render frame-accurate outputs via FFmpeg, and export verified MP4 files.

---

## 1. Product Overview & Key Features

- **Natural Language Prompt Parser**: Interprets user instructions into typed, structured video editing operations (Trimming, 9:16 Vertical, 1:1 Square, 16:9 Landscape, 720p/1080p, Muting, Text Overlays).
- **Anti-Hallucination Guardrails**: Detects ambiguous or unsupported requests (e.g., adding music, 3D LUTs, cinematic grading, face tracking) and rejects them with helpful explanations and accepted syntax examples instead of pretending to execute them.
- **Frame-Accurate Video Engine**: Uses `libx264` re-encoding with fast seeking (`-ss` and `-t`) to prevent freeze-frames and audio desynchronization.
- **Distortion-Free Aspect Ratio Fitting**: Scales video proportionally with clean black pillarbox/letterbox padding (`pad` filter) to convert landscape to vertical 9:16 (Reels/Shorts) or 1:1 (Instagram) without stretching.
- **Contrast Text Overlays**: Automatically generates text overlays with high-contrast translucent background boxes using standard Windows fonts (Arial).
- **ffprobe Output Verification**: Probes rendered outputs to verify actual duration, dimensions, aspect ratio, and audio stream presence.
- **SQLite Session Persistence**: Automatically records every editing job, input/output file metadata, prompt, operations AST, and measured render times in milliseconds.
- **Interactive Evaluation Dashboard**: Runs 10 required technical assessment scenarios live against the engine and reports real-time pass/fail status, output metadata, and measured execution times.

---

## 2. Architecture & Pipeline

```
[Browser Client: React 19 + TypeScript + Vite]
                      │
                      ▼ POST /api/upload
              [Media Ingestion] ──► [ffprobe Metadata Extraction]
                      │
                      ▼ POST /api/parse-prompt
          [Deterministic NLP Parser] ──► [Typed Operations AST]
                      │
                      ▼ POST /api/render
              [Validator & Bounds Checker]
                      │
                      ▼ Canonical Pipeline Builder
             [FFmpeg Argument List (No Shell)]
                      │
                      ▼
              [Real Video Rendering: H.264 / AAC / Faststart]
                      │
                      ▼
             [ffprobe Post-Render Verification]
                      │
                      ▼
          [SQLite Session Audit History] ──► [Download Endpoint]
```

### Engineering Deep-Dive: Stream-Copy vs Frame-Accurate Re-encoding
- **Stream-Copy (`-c copy`)**: Only cuts at the nearest Keyframe (I-frame). Keyframes typically occur every 2 to 10 seconds. Cutting at arbitrary timestamps causes audio/video desync, visual freezes, and cannot apply filters like aspect padding or text overlays.
- **Frame-Accurate Re-encoding (`libx264` + `aac`)**: Decodes and re-encodes frames using `-preset veryfast -crf 22`. Allows exact millisecond cuts, guaranteed audio sync, and arbitrary filter chaining.

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript 5.8, Vite 8, Lucide React icons, Vanilla CSS Design System.
- **Backend**: Python 3.13, FastAPI 0.115, Uvicorn, Pydantic v2.
- **Video Engine**: FFmpeg 9.0.1 Essentials, FFprobe.
- **Database**: SQLite 3 with automatic schema migrations.
- **Testing**: Pytest, FastAPI TestClient, Subprocess validation.

---

## 4. Prerequisites & Windows Setup

### Prerequisites
1. **Python 3.10+** (Python 3.13 tested)
2. **Node.js 18+** (Node.js 24 LTS tested)
3. **FFmpeg & FFprobe**

### Automated Windows Tool Installation
If FFmpeg or Node.js are missing, install them via Windows Package Manager:
```powershell
# Install Node.js LTS
winget install --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements

# Install FFmpeg Essentials
winget install --id Gyan.FFmpeg.Essentials --accept-package-agreements --accept-source-agreements
```
ClipCraft AI automatically discovers FFmpeg and FFprobe on your Windows PATH or standard WinGet/Chocolatey installation paths.

---

## 5. Installation & Running

### Step 1: Clone or Navigate to the Workspace
```powershell
cd "d:\IncuBrix PS2"
```

### Step 2: Backend Setup
```powershell
cd backend
python -m pip install -r requirements.txt
```

### Step 3: Frontend Setup & Build
```powershell
cd ../frontend
npm install
npm run build
```

### Step 4: Run the Application

#### Option A: Unified Single-Server Mode (Recommended)
FastAPI automatically serves both the API endpoints (`/api/...`) and the built React frontend at `http://localhost:8000`:
```powershell
cd "d:\IncuBrix PS2\backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
Open your browser to: **`http://localhost:8000`**

#### Option B: Development Mode (Vite Dev Server + FastAPI)
In Terminal 1 (Backend):
```powershell
cd "d:\IncuBrix PS2\backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
In Terminal 2 (Frontend):
```powershell
cd "d:\IncuBrix PS2\frontend"
npm run dev
```
Open your browser to: **`http://localhost:5173`** (proxies `/api` to port 8000).

---

## 6. Automated Testing

Run the complete test suite covering the NLP prompt parser, operation validator, real FFmpeg video generation engine, and API endpoints:

```powershell
cd "d:\IncuBrix PS2\backend"
python -m pytest tests/ -v
```

### Test Suite Summary:
- **`tests/test_parser.py`** (10 tests): Trimming, aspect ratios (9:16, 1:1, 16:9), muting, text overlays, 720p/1080p resolutions, combined prompts, empty prompts, unsupported prompts.
- **`tests/test_validation.py`** (5 tests): Timestamp bounds, negative durations, out-of-order operations canonical ordering, overlay constraints.
- **`tests/test_engine.py`** (7 tests): Real FFmpeg video rendering, synthetic video generation, real trimming, real 9:16 aspect padding, real 1:1 square conversion, real audio muting, combined multi-operation pipeline.
- **`tests/test_api.py`** (6 tests): Health check, prompt parser API, sample video generation, render flow, session history retrieval.
- **Total: 28 / 28 Tests Passed (100% Pass Rate)**

---

## 7. Supported Prompt Syntax & Examples

| Operation | Natural Language Example | Target AST Parameters |
|---|---|---|
| **Trim Duration** | `Trim the video to the first 15 seconds.` | `start: 0s, end: 15s, duration: 15s` |
| **Trim Range** | `Trim from 5s to 20s` | `start: 5s, end: 20s, duration: 15s` |
| **Vertical 9:16** | `Resize the video to vertical 9:16 for Reels.` | `target_ratio: "9:16", strategy: "pad"` |
| **Square 1:1** | `Convert the video to square 1:1 format.` | `target_ratio: "1:1", strategy: "pad"` |
| **Widescreen 16:9** | `Resize to widescreen 16:9 format` | `target_ratio: "16:9", strategy: "pad"` |
| **Resolution 720p** | `Export the video at 720p resolution.` | `target_resolution: "720p"` |
| **Resolution 1080p** | `Export the video at 1080p` | `target_resolution: "1080p"` |
| **Audio Mute** | `Mute the original audio.` | `mute: true (FFmpeg -an)` |
| **Text Overlay** | `Add the title "My Travel Story" at the beginning.` | `text: "My Travel Story", pos: "top", dur: 5s` |
| **Combined** | `Trim to 20 seconds, resize to 9:16, and mute the audio.` | `[trim, aspect_ratio, mute_audio]` |

---

## 8. Evaluation & Benchmark Suite (10 Scenarios)

ClipCraft AI includes a dedicated evaluation dashboard (`/api/evaluation/run`) implementing the 10 assessment criteria:

1. **Valid Video Upload & Probe**: Verified MP4 container, H.264 video, and AAC audio streams.
2. **Invalid File Rejection**: Rejects non-video and corrupt files safely with HTTP 400.
3. **Basic Trimming**: Trims to specified seconds with frame accuracy.
4. **9:16 Vertical Conversion**: Resizes to 720x1280 (9:16) with padding to prevent distortion.
5. **1:1 Square Conversion**: Resizes to 720x720 (1:1) with padding.
6. **Text Overlay**: Adds legible text overlay with background contrast box.
7. **Audio Muting**: Strips audio stream and verifies `-an` using ffprobe (`has_audio: false`).
8. **Combined Operations**: Executes Trim + Resize + Text + Audio Mute in a single pass.
9. **Unsupported Prompt Handling**: Rejects requests for AI music, filters, or speed ramping with clear syntax guidance.
10. **Invalid Timestamp Handling**: Bounds-checks timestamps against total video duration.

---

## 9. API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | `GET` | Health check and FFmpeg tool verification |
| `/api/upload` | `POST` | Upload video file and extract ffprobe metadata |
| `/api/sample-video` | `POST` | Load pre-generated synthetic sample video |
| `/api/parse-prompt` | `POST` | Parse natural language instruction into operations AST |
| `/api/render` | `POST` | Execute FFmpeg editing pipeline and save session |
| `/api/jobs/{id}` | `GET` | Retrieve job details and status |
| `/api/history` | `GET` | Retrieve SQLite session history |
| `/api/download/{id}` | `GET` | Download rendered MP4 file |
| `/api/evaluation/run`| `GET` | Run live 10-scenario assessment benchmark suite |

---

## 10. Security & Quality Guardrails

1. **Subprocess Isolation**: FFmpeg commands are constructed as strict argument lists without shell interpolation (`shell=True` is prohibited).
2. **Path Sanitization**: User-supplied filenames are never used as raw filesystem paths; randomized UUIDs are used for storage isolation.
3. **Upload Quota**: Uploads are enforced with a strict 100MB limit.
4. **Execution Timeouts**: Video rendering commands enforce a 180-second subprocess timeout.
5. **Deterministic Parser**: Never executes hallucinated commands; ambiguous intents return actionable validation messages.

---

## 11. Known Limitations & Roadmap

- **Audio Mixing**: Current audio features focus on muting/stripping original audio. Secondary background music mixing is planned for v1.1.
- **Complex Keyframing**: Advanced pan-and-zoom or dynamic motion transitions are not included in the deterministic rule parser.
- **Speech-to-Text Subtitling**: Automatic speech captioning requires local Whisper integration and is slated for future release.

---

## 12. License
MIT License. Developed for IncuBrix Software Engineer Assessment — PS2.
