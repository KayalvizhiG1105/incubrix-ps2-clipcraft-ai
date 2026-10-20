import React, { useRef, useState } from 'react';
import { UploadCloud, FileVideo, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import type { MediaMetadata } from '../types';

interface VideoUploadProps {
  metadata: MediaMetadata | null;
  videoUrl: string | null;
  onFileUpload: (file: File) => void;
  onLoadSample: () => void;
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  metadata,
  onFileUpload,
  onLoadSample,
  isUploading,
  uploadProgress,
  uploadError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  // If a video is already uploaded and probed, show the metadata card with replace button
  if (metadata) {
    const sizeMb = (metadata.size_bytes / (1024 * 1024)).toFixed(2);
    return (
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: 'var(--success-bg)',
                color: 'var(--success-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileVideo size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                {metadata.filename}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {sizeMb} MB • Container: {metadata.format_name.split(',')[0].toUpperCase()}
              </div>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
          >
            <RefreshCw size={13} />
            Replace Video
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        {/* Media Properties Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          <span className="badge badge-indigo">
            Duration: {metadata.duration}s
          </span>
          <span className="badge badge-neutral">
            Dimensions: {metadata.width}×{metadata.height}
          </span>
          <span className="badge badge-neutral">
            Aspect: {metadata.aspect_ratio}
          </span>
          <span className="badge badge-neutral">
            Codec: {metadata.video_codec.toUpperCase()}
          </span>
          <span className={`badge ${metadata.has_audio ? 'badge-success' : 'badge-warning'}`}>
            {metadata.has_audio ? `Audio: ${metadata.audio_codec || 'Active'}` : 'No Audio'}
          </span>
          <span className="badge badge-neutral">
            {metadata.fps} FPS
          </span>
        </div>
      </div>
    );
  }

  // Upload Zone State
  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className="card"
      style={{
        border: isDragOver ? '2px dashed var(--accent-primary)' : '2px dashed var(--border-subtle)',
        backgroundColor: isDragOver ? 'var(--accent-light)' : 'var(--bg-surface)',
        textAlign: 'center',
        padding: '2.25rem 1.5rem',
        marginBottom: '1.25rem',
        transition: 'all 0.2s',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div
        style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent-light)',
          color: 'var(--accent-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem',
        }}
      >
        <UploadCloud size={28} />
      </div>

      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
        Upload your video for AI editing
      </div>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
        Drag and drop your MP4, MOV, or WebM video file here (up to 100MB), or select from your computer.
      </p>

      {/* Upload Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="btn btn-primary"
        >
          <FileVideo size={16} />
          Browse Files
        </button>

        <button
          onClick={onLoadSample}
          disabled={isUploading}
          className="btn btn-outline-primary"
        >
          <Sparkles size={16} />
          Use Demo Sample Video
        </button>
      </div>

      {/* Progress Bar */}
      {isUploading && (
        <div style={{ marginTop: '1.25rem', maxWidth: '320px', margin: '1.25rem auto 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
            <span>Uploading & probing media...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div style={{ height: '6px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${uploadProgress}%`,
                backgroundColor: 'var(--accent-primary)',
                transition: 'width 0.2s',
              }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.625rem 0.875rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger-text)',
            fontSize: '0.8125rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={16} />
          {uploadError}
        </div>
      )}
    </div>
  );
};
