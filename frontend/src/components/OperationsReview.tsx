import React from 'react';
import {
  Scissors,
  Maximize,
  Tv,
  VolumeX,
  Type,
  PlayCircle,
  AlertTriangle,
  Loader2,
  Trash2,
  Sliders
} from 'lucide-react';
import type { Operation } from '../types';

interface OperationsReviewProps {
  operations: Operation[];
  explanations: string[];
  unsupportedIntents: string[];
  onRemoveOperation: (index: number) => void;
  onRender: () => void;
  isRendering: boolean;
  renderElapsedSec: number;
  renderError: string | null;
  hasVideo: boolean;
}

export const OperationsReview: React.FC<OperationsReviewProps> = ({
  operations,
  explanations,
  unsupportedIntents,
  onRemoveOperation,
  onRender,
  isRendering,
  renderElapsedSec,
  renderError,
  hasVideo,
}) => {
  if (unsupportedIntents.length > 0) {
    return (
      <div className="card" style={{ marginBottom: '1.25rem', borderColor: 'var(--warning-border)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--warning-bg)',
              color: 'var(--warning-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--warning-text)', marginBottom: '0.25rem' }}>
              Unsupported Editing Instruction Detected
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              ClipCraft AI strictly avoids pretending to execute instructions it does not support:
            </p>
            <ul style={{ fontSize: '0.8125rem', color: 'var(--danger-text)', paddingLeft: '1.25rem', marginBottom: '0.75rem' }}>
              {unsupportedIntents.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '0.25rem' }}>{item}</li>
              ))}
            </ul>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Tip: Currently supported operations include: Trimming duration/timestamps, Aspect Ratio (16:9, 9:16, 1:1), Resolution (720p, 1080p, 480p), Muting original audio, and Text overlays.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (operations.length === 0) {
    return null;
  }

  const renderIcon = (type: string) => {
    switch (type) {
      case 'trim':
        return <Scissors size={16} />;
      case 'aspect_ratio':
        return <Maximize size={16} />;
      case 'resolution':
        return <Tv size={16} />;
      case 'text_overlay':
        return <Type size={16} />;
      case 'mute_audio':
        return <VolumeX size={16} />;
      default:
        return <Sliders size={16} />;
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: 'var(--accent-light)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sliders size={16} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Planned Editing Pipeline ({operations.length} {operations.length === 1 ? 'operation' : 'operations'})
          </span>
        </div>

        <span className="badge badge-indigo">Ready for Execution</span>
      </div>

      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
        Review the interpreted operations below. Operations will be applied in the verified canonical pipeline order:
      </p>

      {/* Operation Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        {operations.map((op, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.625rem 0.875rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  color: 'var(--accent-primary)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {renderIcon(op.type)}
              </div>

              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  {explanations[index] || op.type.toUpperCase()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {op.type === 'trim' && `Start: ${op.start_seconds}s • End: ${op.end_seconds ?? 'end'}s • Duration: ${op.duration ?? 0}s`}
                  {op.type === 'aspect_ratio' && `Target: ${op.target_ratio} • Strategy: ${op.fit_strategy === 'pad' ? 'Letterbox / Pillarbox padding' : 'Center crop'}`}
                  {op.type === 'resolution' && `Target: ${op.target_resolution}`}
                  {op.type === 'mute_audio' && `Remove audio track from video stream (-an)`}
                  {op.type === 'text_overlay' && `Position: ${op.position} • Font: Arial • Contrast box: Active`}
                </div>
              </div>
            </div>

            <button
              onClick={() => onRemoveOperation(index)}
              style={{
                color: 'var(--text-muted)',
                padding: '0.35rem',
                borderRadius: 'var(--radius-sm)',
              }}
              title="Remove operation"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      {/* Render Error */}
      {renderError && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.625rem 0.875rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger-text)',
            fontSize: '0.8125rem',
          }}
        >
          {renderError}
        </div>
      )}

      {/* Render Action Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {isRendering ? `FFmpeg processing in progress... (${renderElapsedSec}s)` : 'Renders with FFmpeg re-encoding for frame accuracy'}
        </div>

        <button
          onClick={onRender}
          disabled={!hasVideo || isRendering || operations.length === 0}
          className="btn btn-primary"
          style={{ minWidth: '150px' }}
        >
          {isRendering ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Rendering ({renderElapsedSec}s)
            </>
          ) : (
            <>
              <PlayCircle size={16} />
              Render Video
            </>
          )}
        </button>
      </div>
    </div>
  );
};
