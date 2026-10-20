import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Download,
  Play,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  RefreshCw
} from 'lucide-react';
import type { SessionHistoryItem } from '../types';
import { api } from '../services/api';

interface HistoryViewProps {
  onLoadSessionInEditor: (session: SessionHistoryItem) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onLoadSessionInEditor }) => {
  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'failed'>('all');

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.fetchHistory();
      setSessions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load session history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredSessions = sessions.filter((s) => {
    const matchesQuery =
      (s.project_title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.prompt || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.original_filename || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ? true : s.status.toLowerCase() === statusFilter;

    return matchesQuery && matchesStatus;
  });

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 1.5rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Projects & Session History
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Persistent SQLite audit record of all video editing jobs, prompt instructions, and measured render times.
          </p>
        </div>

        <button onClick={fetchHistory} className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card" style={{ padding: '0.875rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by project name, prompt, or filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', border: 'none', padding: '0.4rem 0' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Status:</span>
          {(['all', 'completed', 'failed'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.3rem 0.625rem',
                borderRadius: 'var(--radius-sm)',
                textTransform: 'capitalize',
                backgroundColor: statusFilter === filter ? 'var(--accent-primary)' : 'var(--bg-surface-subtle)',
                color: statusFilter === filter ? '#ffffff' : 'var(--text-secondary)',
              }}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
          <div>Loading sessions from SQLite...</div>
        </div>
      )}

      {error && (
        <div className="card" style={{ backgroundColor: 'var(--danger-bg)', borderColor: 'var(--danger-border)', color: 'var(--danger-text)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span style={{ fontWeight: 600 }}>Error: {error}</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredSessions.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
          <History size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            No sessions found
          </div>
          <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
            {searchQuery ? 'No sessions match your search criteria.' : 'You have not rendered any video editing jobs yet. Head over to the Editor to render your first video!'}
          </p>
        </div>
      )}

      {/* Sessions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredSessions.map((session) => {
          const isCompleted = session.status.toLowerCase() === 'completed';
          const renderTimeSec = session.processing_time_ms ? (session.processing_time_ms / 1000).toFixed(2) : '0';
          const dateStr = new Date(session.created_at).toLocaleString();

          return (
            <div key={session.session_id} className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                      {session.project_title || 'Untitled Project'}
                    </span>
                    <span className={`badge ${isCompleted ? 'badge-success' : 'badge-danger'}`}>
                      {isCompleted ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                      {session.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={13} /> {dateStr}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={13} /> Render: {renderTimeSec}s ({session.processing_time_ms || 0} ms)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <FileVideo size={13} /> {session.original_filename}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {session.download_url && isCompleted && (
                    <a
                      href={session.download_url}
                      download
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', textDecoration: 'none' }}
                    >
                      <Download size={13} /> Download MP4
                    </a>
                  )}

                  <button
                    onClick={() => onLoadSessionInEditor(session)}
                    className="btn btn-outline-primary"
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                  >
                    <Play size={13} /> Open in Studio
                  </button>
                </div>
              </div>

              {/* Prompt box */}
              {session.prompt && (
                <div style={{ backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', padding: '0.625rem 0.875rem', fontSize: '0.8125rem', marginBottom: '0.75rem', borderLeft: '3px solid var(--accent-primary)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    PROMPT
                  </div>
                  <div style={{ color: 'var(--text-primary)', marginTop: '2px', fontStyle: 'italic' }}>
                    "{session.prompt}"
                  </div>
                </div>
              )}

              {/* Operations badges & Output summary */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>
                    Operations:
                  </span>
                  {session.operations.map((op, idx) => (
                    <span key={idx} className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                      {op.type.toUpperCase()}
                      {op.type === 'trim' && ` (${op.duration || 0}s)`}
                      {op.type === 'aspect_ratio' && ` (${op.target_ratio})`}
                      {op.type === 'resolution' && ` (${op.target_resolution})`}
                    </span>
                  ))}
                </div>

                {session.output_metadata && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Output: {session.output_metadata.width}×{session.output_metadata.height} • {session.output_metadata.duration}s • {session.output_metadata.has_audio ? 'Audio On' : 'Muted'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
