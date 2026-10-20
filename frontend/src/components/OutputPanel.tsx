import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  Volume2,
  VolumeX,
  RotateCcw
} from 'lucide-react';
import { VideoPreview } from './VideoPreview';
import type { MediaMetadata } from '../types';

interface OutputPanelProps {
  outputUrl: string | null;
  downloadUrl: string | null;
  outputMetadata: MediaMetadata | null;
  processingTimeMs: number | null;
  originalVideoUrl: string | null;
  originalMetadata: MediaMetadata | null;
  onReset: () => void;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
  outputUrl,
  downloadUrl,
  outputMetadata,
  processingTimeMs,
  originalVideoUrl,
  originalMetadata,
  onReset,
}) => {
  const [activeTab, setActiveTab] = useState<'output' | 'compare'>('output');

  if (!outputUrl || !outputMetadata) {
    return null;
  }

  const renderTimeSec = processingTimeMs ? (processingTimeMs / 1000).toFixed(2) : '0';
  const sizeMb = (outputMetadata.size_bytes / (1024 * 1024)).toFixed(2);

  return (
    <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--accent-border)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
              Render Completed Successfully
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Verified by ffprobe in {renderTimeSec}s ({processingTimeMs} ms)
            </div>
          </div>
        </div>

        {/* View mode toggle */}
        <div style={{ display: 'flex', backgroundColor: 'var(--bg-surface-subtle)', padding: '0.2rem', borderRadius: 'var(--radius-md)' }}>
          <button
            onClick={() => setActiveTab('output')}
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: activeTab === 'output' ? '#ffffff' : 'transparent',
              color: activeTab === 'output' ? 'var(--accent-primary)' : 'var(--text-muted)',
              boxShadow: activeTab === 'output' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            Output Video
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: activeTab === 'compare' ? '#ffffff' : 'transparent',
              color: activeTab === 'compare' ? 'var(--accent-primary)' : 'var(--text-muted)',
              boxShadow: activeTab === 'compare' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            Compare Side-by-Side
          </button>
        </div>
      </div>

      {/* Video Previews */}
      {activeTab === 'output' ? (
        <VideoPreview
          videoUrl={outputUrl}
          metadata={outputMetadata}
          label="Rendered Result"
          isProcessed={true}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              ORIGINAL INPUT
            </div>
            <VideoPreview
              videoUrl={originalVideoUrl}
              metadata={originalMetadata}
              label="Original Input"
            />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.35rem' }}>
              PROCESSED OUTPUT
            </div>
            <VideoPreview
              videoUrl={outputUrl}
              metadata={outputMetadata}
              label="Processed Output"
              isProcessed={true}
            />
          </div>
        </div>
      )}

      {/* Verified Output Technical Specifications */}
      <div style={{ backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', padding: '0.875rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
          ffprobe Verified Output Specifications
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.625rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Duration</div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{outputMetadata.duration}s</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Resolution</div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{outputMetadata.width}×{outputMetadata.height}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Aspect Ratio</div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{outputMetadata.aspect_ratio}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Audio Track</div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {outputMetadata.has_audio ? (
                <>
                  <Volume2 size={13} style={{ color: 'var(--success-text)' }} /> {outputMetadata.audio_codec || 'Active'}
                </>
              ) : (
                <>
                  <VolumeX size={13} style={{ color: 'var(--text-muted)' }} /> Muted (No Audio)
                </>
              )}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>File Size</div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{sizeMb} MB</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Render Time</div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{renderTimeSec}s</div>
          </div>
        </div>
      </div>

      {/* Download and New Session Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={onReset}
          className="btn btn-secondary"
        >
          <RotateCcw size={15} />
          Edit Another Version
        </button>

        {downloadUrl && (
          <a
            href={downloadUrl}
            download
            className="btn btn-primary"
            style={{ textDecoration: 'none' }}
          >
            <Download size={16} />
            Download Processed MP4
          </a>
        )}
      </div>
    </div>
  );
};
