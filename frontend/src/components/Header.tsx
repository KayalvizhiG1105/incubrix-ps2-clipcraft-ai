import React, { useState } from 'react';
import { Edit2, Check, RotateCcw, Sparkles } from 'lucide-react';
import type { NavTab } from '../types';

interface HeaderProps {
  currentTab: NavTab;
  projectTitle: string;
  onUpdateTitle: (title: string) => void;
  onResetSession: () => void;
  onLoadSample: () => void;
  isLoadingSample: boolean;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  projectTitle,
  onUpdateTitle,
  onResetSession,
  onLoadSample,
  isLoadingSample,
  isProcessing,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(projectTitle);

  const handleSave = () => {
    if (tempTitle.trim()) {
      onUpdateTitle(tempTitle.trim());
    }
    setIsEditing(false);
  };

  const getTabLabel = () => {
    switch (currentTab) {
      case 'editor':
        return 'Video Studio';
      case 'history':
        return 'Session History';
      case 'evaluation':
        return 'Assessment Evaluation';
      case 'docs':
        return 'Documentation & Architecture';
    }
  };

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        flexShrink: 0,
      }}
    >
      {/* Title / Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {getTabLabel()}
        </div>

        <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-subtle)' }} />

        {isEditing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.9rem', width: '240px' }}
            />
            <button
              onClick={handleSave}
              className="btn btn-primary"
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
            >
              <Check size={14} />
            </button>
          </div>
        ) : (
          <div
            onClick={() => {
              setTempTitle(projectTitle);
              setIsEditing(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              padding: '0.25rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              transition: 'background-color 0.15s',
            }}
            title="Click to rename project"
          >
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {projectTitle}
            </span>
            <Edit2 size={13} style={{ color: 'var(--text-muted)' }} />
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {currentTab === 'editor' && (
          <>
            <button
              onClick={onLoadSample}
              disabled={isLoadingSample || isProcessing}
              className="btn btn-outline-primary"
              style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem' }}
              title="Load a 15-second synthetic test video for rapid testing"
            >
              <Sparkles size={15} />
              {isLoadingSample ? 'Generating Video...' : 'Load Sample Video'}
            </button>

            <button
              onClick={onResetSession}
              disabled={isProcessing}
              className="btn btn-secondary"
              style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem' }}
              title="Reset current project and video"
            >
              <RotateCcw size={15} />
              Reset Project
            </button>
          </>
        )}
      </div>
    </header>
  );
};
