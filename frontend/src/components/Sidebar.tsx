import React from 'react';
import { Film, History, CheckCircle2, BookOpen, Sparkles, Check, AlertCircle } from 'lucide-react';
import type { NavTab } from '../types';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  systemHealth: { status: string; ffmpeg: string; ffprobe: string } | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, systemHealth }) => {
  const navItems = [
    { id: 'editor' as NavTab, label: 'Editor', icon: Film, desc: 'Prompt video workspace' },
    { id: 'history' as NavTab, label: 'Session History', icon: History, desc: 'Past projects & exports' },
    { id: 'evaluation' as NavTab, label: 'Evaluation & Tests', icon: CheckCircle2, desc: '10 assessment scenarios' },
    { id: 'docs' as NavTab, label: 'Documentation', icon: BookOpen, desc: 'Architecture & prompt guide' },
  ];

  const isFfmpegReady = systemHealth?.ffmpeg === 'available' && systemHealth?.ffprobe === 'available';

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)',
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              ClipCraft AI
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              IncuBrix Assessment • PS2
            </div>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', padding: '0 0.5rem 0.25rem', letterSpacing: '0.05em' }}>
          Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--accent-light)' : 'transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                textAlign: 'left',
                width: '100%',
                border: isActive ? '1px solid var(--accent-border)' : '1px solid transparent',
              }}
            >
              <Icon size={18} style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
              <div>
                <div style={{ fontSize: '0.875rem', lineHeight: 1.2 }}>{item.label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.desc}</div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Engine Status Indicator in Footer */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>FFmpeg Engine</span>
          <span className={`badge ${isFfmpegReady ? 'badge-success' : 'badge-danger'}`}>
            {isFfmpegReady ? (
              <>
                <Check size={12} /> Active
              </>
            ) : (
              <>
                <AlertCircle size={12} /> Offline
              </>
            )}
          </span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {isFfmpegReady ? 'ffprobe & libx264 ready' : 'FFmpeg not detected'}
        </div>
      </div>
    </aside>
  );
};
