import React from 'react';
import { Sliders, HelpCircle, HardDrive } from 'lucide-react';
import type { MediaMetadata, Operation } from '../types';

interface RightPanelProps {
  metadata: MediaMetadata | null;
  operations: Operation[];
  onPromptClick: (sample: string) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({ metadata, operations, onPromptClick }) => {
  return (
    <aside
      style={{
        width: '320px',
        flexShrink: 0,
        backgroundColor: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-subtle)',
        padding: '1.25rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      {/* Active Video Technical Inspector */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <HardDrive size={16} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
            Media Inspector
          </span>
        </div>

        {metadata ? (
          <div style={{ backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', padding: '0.75rem', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>File</span>
              <span style={{ fontWeight: 600, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {metadata.filename}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Dimensions</span>
              <span style={{ fontWeight: 600 }}>{metadata.width} × {metadata.height}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Aspect Ratio</span>
              <span style={{ fontWeight: 600 }}>{metadata.aspect_ratio}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Duration</span>
              <span style={{ fontWeight: 600 }}>{metadata.duration}s</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Video Codec</span>
              <span style={{ fontWeight: 600 }}>{metadata.video_codec.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Audio Track</span>
              <span style={{ fontWeight: 600 }}>{metadata.has_audio ? (metadata.audio_codec || 'Active') : 'None'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
              <span style={{ color: 'var(--text-muted)' }}>Frame Rate</span>
              <span style={{ fontWeight: 600 }}>{metadata.fps} FPS</span>
            </div>
          </div>
        ) : (
          <div style={{ padding: '1rem', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            No video loaded. Upload a video or load a sample to inspect its media streams.
          </div>
        )}
      </div>

      {/* Operation Pipeline Summary */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Sliders size={16} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
            Execution Order
          </span>
        </div>

        {operations.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {operations.map((op, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                  padding: '0.4rem 0.6rem',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>#{idx + 1}</span>
                <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{op.type.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            No operations queued. Type an instruction like "trim to 15s" above.
          </div>
        )}
      </div>

      {/* Supported Prompt Guide Quick Links */}
      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <HelpCircle size={15} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Quick Prompts
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {[
            'Trim to first 10 seconds',
            'Resize to vertical 9:16',
            'Convert to square 1:1',
            'Mute original audio',
            'Add title "ClipCraft"',
          ].map((promptText, i) => (
            <button
              key={i}
              onClick={() => onPromptClick(promptText)}
              style={{
                fontSize: '0.75rem',
                textAlign: 'left',
                padding: '0.35rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'transparent',
                color: 'var(--accent-primary)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--accent-light)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              + {promptText}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
