import React from 'react';
import {
  Code2,
  Cpu,
  Layers,
  ShieldAlert,
  Sliders
} from 'lucide-react';

export const DocsView: React.FC = () => {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 1.5rem', maxWidth: '960px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            ClipCraft AI Documentation & Engine Architecture
          </h1>
        </div>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)' }}>
          Comprehensive technical guide for the IncuBrix Software Engineer Assessment (Problem Statement PS2 — Prompt-Based Video Editing Engine).
        </p>
      </div>

      {/* Section 1: Product Overview & Architecture */}
      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Cpu size={20} style={{ color: 'var(--accent-primary)' }} />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            1. System Architecture & Processing Pipeline
          </h2>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
          ClipCraft AI converts unstructured human instructions into a strictly typed, canonical video editing graph. It prevents accidental hallucinations or destructive commands by decoupling prompt parsing from execution, validating bounds against input video metadata extracted by <code>ffprobe</code>, and executing via parameterized subprocess arguments.
        </p>

        <div style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderRadius: 'var(--radius-md)', padding: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: 1.6, overflowX: 'auto', marginBottom: '1rem' }}>
          {`[Browser Frontend: React + TypeScript + Vite]
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
      [SQLite Session Audit History] ──► [Download Endpoint]`}
        </div>
      </section>

      {/* Section 2: Supported Prompt Syntax */}
      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Code2 size={20} style={{ color: 'var(--accent-primary)' }} />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            2. Supported Prompt Syntax & Real Examples
          </h2>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          The NLP parser extracts structured operations with unit normalization (seconds, hh:mm:ss, aspect ratios, overlay text quotes):
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-surface-subtle)', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '0.625rem 0.75rem', fontWeight: 700 }}>Operation</th>
                <th style={{ padding: '0.625rem 0.75rem', fontWeight: 700 }}>Natural Language Prompt Example</th>
                <th style={{ padding: '0.625rem 0.75rem', fontWeight: 700 }}>Interpreted Parameter AST</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>Trim Duration</td>
                <td style={{ padding: '0.625rem 0.75rem' }}>"Trim the video to the first 15 seconds."</td>
                <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)' }}>start: 0s, end: 15s, duration: 15s</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>Trim Timestamp Range</td>
                <td style={{ padding: '0.625rem 0.75rem' }}>"Trim from 5s to 20s"</td>
                <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)' }}>start: 5s, end: 20s, duration: 15s</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>Vertical 9:16 Aspect</td>
                <td style={{ padding: '0.625rem 0.75rem' }}>"Resize the video to vertical 9:16 for Reels."</td>
                <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)' }}>target_ratio: "9:16", strategy: "pad"</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>Square 1:1 Aspect</td>
                <td style={{ padding: '0.625rem 0.75rem' }}>"Convert the video to square 1:1 format."</td>
                <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)' }}>target_ratio: "1:1", strategy: "pad"</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>Audio Muting</td>
                <td style={{ padding: '0.625rem 0.75rem' }}>"Mute the original audio."</td>
                <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)' }}>mute: true (FFmpeg -an)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>Text Overlay</td>
                <td style={{ padding: '0.625rem 0.75rem' }}>'Add the title "My Travel Story" at the beginning.'</td>
                <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)' }}>text: "My Travel Story", pos: "top"</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>Resolution Scaling</td>
                <td style={{ padding: '0.625rem 0.75rem' }}>"Export the video at 720p resolution."</td>
                <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)' }}>target_resolution: "720p"</td>
              </tr>
              <tr>
                <td style={{ padding: '0.625rem 0.75rem', fontWeight: 600 }}>Multi-Operation</td>
                <td style={{ padding: '0.625rem 0.75rem' }}>"Trim to 20 seconds, resize to 9:16, and mute the audio."</td>
                <td style={{ padding: '0.625rem 0.75rem', fontFamily: 'var(--font-mono)' }}>[trim, aspect_ratio, mute_audio]</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 3: Engineering Deep-Dive - Stream-Copy vs Re-encoding */}
      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Layers size={20} style={{ color: 'var(--accent-primary)' }} />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            3. Technical Deep-Dive: Stream-Copy vs Frame-Accurate Re-encoding
          </h2>
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <p style={{ marginBottom: '0.75rem' }}>
            In video processing, <strong>stream copying</strong> (<code>-c copy</code>) simply copies packets without decoding. While fast, stream copy can <em>only</em> cut on keyframes (I-frames / Intra-coded frames). Keyframes often occur only every 2 to 10 seconds. Consequently:
          </p>
          <ul style={{ paddingLeft: '1.25rem', marginBottom: '0.75rem' }}>
            <li>Trimming to an exact timestamp like <code>00:15.200</code> with stream copy results in either cutting at the preceding keyframe (e.g. <code>00:12</code>) or succeeding keyframe (e.g. <code>00:16</code>).</li>
            <li>Stream copy causes visible freeze frames, black artifacts, and severe audio desynchronization at cut boundaries.</li>
            <li>Stream copy cannot apply video filters (such as aspect ratio padding, resizing, or text overlays).</li>
          </ul>
          <p>
            <strong>ClipCraft AI Architecture Decision:</strong> We employ frame-accurate re-encoding using <code>libx264</code> (with <code>-preset veryfast</code> and <code>-crf 22</code>) paired with input seeking (<code>-ss</code> before <code>-i</code>). This ensures exact millisecond cut precision, seamless audio sync, and the ability to compose rich visual filters in a single pass.
          </p>
        </div>
      </section>

      {/* Section 4: Aspect Ratio Fit Strategy */}
      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Sliders size={20} style={{ color: 'var(--accent-primary)' }} />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            4. Aspect Ratio & Distortion Prevention Strategy
          </h2>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
          Stretching video to fit modern mobile formats (like 9:16 for Reels/Shorts or 1:1 for Instagram) causes severe optical distortion and an amateur user experience. ClipCraft AI implements two defined strategies:
        </p>
        <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', lineHeight: 1.6 }}>
          <li>
            <strong>Pad Strategy (Default):</strong> Scales video proportionally to fit within target bounds, then applies clean black pillarbox / letterbox padding via <code>scale=w:h:force_original_aspect_ratio=decrease,pad=w:h:(ow-iw)/2:(oh-ih)/2:color=black</code>. The entire original image is preserved with zero distortion.
          </li>
          <li>
            <strong>Crop Strategy (On explicit request):</strong> Scales video to completely fill the canvas, then crops excess margin from the center via <code>scale=w:h:force_original_aspect_ratio=increase,crop=w:h</code>.
          </li>
        </ul>
      </section>

      {/* Section 5: Security & Guardrails */}
      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <ShieldAlert size={20} style={{ color: 'var(--accent-primary)' }} />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            5. Security & Reliability Guardrails
          </h2>
        </div>
        <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', lineHeight: 1.6 }}>
          <li>
            <strong>Subprocess Argument Lists:</strong> FFmpeg commands are never passed to a shell (<code>shell=True</code> is strictly forbidden). All arguments are isolated in Python lists, preventing command injection attacks.
          </li>
          <li>
            <strong>Safe Filenames & Path Isolation:</strong> Uploaded and generated files use randomized UUID prefixes. User-supplied filenames are never used as raw filesystem paths.
          </li>
          <li>
            <strong>Strict Quotas & Timeouts:</strong> Uploads are capped at 100MB. Video rendering processes have an enforced 180-second subprocess timeout.
          </li>
          <li>
            <strong>Deterministic Rejection:</strong> Unrecognized or unsupported requests (e.g., "add background music", "color grade like Hollywood") are politely rejected with actionable syntax guidance rather than silently executing corrupted edits.
          </li>
        </ul>
      </section>
    </div>
  );
};
