import type {
  UploadResponse,
  ParsePromptResponse,
  RenderRequest,
  JobResponse,
  SessionHistoryItem,
  EvaluationSuiteResult
} from '../types';

const BASE_URL = '/api';

export const api = {
  async checkHealth(): Promise<{ status: string; ffmpeg: string; ffprobe: string; max_upload_size_mb: number }> {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async uploadVideo(file: File, onProgress?: (pct: number) => void): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASE_URL}/upload`);

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            onProgress(pct);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(new Error('Invalid JSON response from server'));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.detail || 'Upload failed'));
          } catch (e) {
            reject(new Error(`Upload failed with HTTP ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(formData);
    });
  },

  async loadSampleVideo(): Promise<UploadResponse> {
    const res = await fetch(`${BASE_URL}/sample-video`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to load sample video');
    }
    return res.json();
  },

  async parsePrompt(prompt: string, videoDuration?: number): Promise<ParsePromptResponse> {
    const res = await fetch(`${BASE_URL}/parse-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, video_duration: videoDuration })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to parse prompt');
    }
    return res.json();
  },

  async renderVideo(payload: RenderRequest): Promise<JobResponse> {
    const res = await fetch(`${BASE_URL}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Rendering failed');
    }
    return res.json();
  },

  async fetchHistory(): Promise<SessionHistoryItem[]> {
    const res = await fetch(`${BASE_URL}/history`);
    if (!res.ok) throw new Error('Failed to fetch session history');
    return res.json();
  },

  async fetchJob(sessionId: string): Promise<SessionHistoryItem> {
    const res = await fetch(`${BASE_URL}/jobs/${sessionId}`);
    if (!res.ok) throw new Error('Failed to fetch job details');
    return res.json();
  },

  async runEvaluations(): Promise<EvaluationSuiteResult> {
    const res = await fetch(`${BASE_URL}/evaluation/run`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to run evaluations');
    }
    return res.json();
  }
};
