import React from 'react';
import { Wand2, X, AlertCircle } from 'lucide-react';

interface PromptComposerProps {
  prompt: string;
  onPromptChange: (val: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  isParsing: boolean;
  hasVideo: boolean;
  parseError: string | null;
}

const EXAMPLE_PROMPTS = [
  "Trim the video to the first 15 seconds.",
  "Resize the video to vertical 9:16 for Reels.",
  "Convert the video to square 1:1 format.",
  "Mute the original audio.",
  'Add the title "My Travel Story" at the beginning.',
  "Trim to 20 seconds, resize to 9:16, and mute the audio.",
  "Export the video at 720p resolution."
];

export const PromptComposer: React.FC<PromptComposerProps> = ({
  prompt,
  onPromptChange,
  onSubmit,
  onClear,
  isParsing,
  hasVideo,
  parseError,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (prompt.trim() && hasVideo) {
        onSubmit();
      }
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
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
            <Wand2 size={16} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            Natural Language Instruction Composer
          </span>
        </div>

        {prompt && (
          <button
            onClick={onClear}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
          >
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Multiline Prompt Textarea */}
      <div style={{ position: 'relative' }}>
        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the changes you want to make to your video (e.g. 'Trim to 10s, resize to 9:16, and mute audio')..."
          style={{
            width: '100%',
            fontSize: '0.9375rem',
            lineHeight: 1.5,
            resize: 'vertical',
            minHeight: '86px',
          }}
        />
      </div>

      {/* Example Prompt Chips */}
      <div style={{ marginTop: '0.75rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
          Example Prompts (click to load):
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {EXAMPLE_PROMPTS.map((ex, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onPromptChange(ex)}
              style={{
                fontSize: '0.75rem',
                padding: '0.3rem 0.625rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-surface-subtle)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                textAlign: 'left',
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Validation or Parse Error Warning */}
      {parseError && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.625rem 0.875rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger-text)',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>{parseError}</div>
        </div>
      )}

      {/* Action Submit Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Press <kbd style={{ padding: '0.1rem 0.35rem', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>Ctrl+Enter</kbd> to interpret
        </div>

        <button
          onClick={onSubmit}
          disabled={!prompt.trim() || !hasVideo || isParsing}
          className="btn btn-primary"
        >
          <Wand2 size={15} />
          {isParsing ? 'Interpreting Prompt...' : 'Interpret Instructions'}
        </button>
      </div>
    </div>
  );
};
