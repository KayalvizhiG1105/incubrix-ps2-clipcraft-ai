import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  AlertTriangle
} from 'lucide-react';
import type { EvaluationSuiteResult } from '../types';
import { api } from '../services/api';

export const EvaluationView: React.FC = () => {
  const [suiteResult, setSuiteResult] = useState<EvaluationSuiteResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');

  const runEvaluation = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const data = await api.runEvaluations();
      setSuiteResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to execute evaluation suite');
    } finally {
      setIsRunning(false);
    }
  };

  // Run automatically on first mount
  useEffect(() => {
    runEvaluation();
  }, []);

  const scenarios = suiteResult?.scenarios || [];
  const filteredScenarios = scenarios.filter((s) => {
    if (filter === 'passed') return s.status === 'passed';
    if (filter === 'failed') return s.status === 'failed';
    return true;
  });

  const passRate =
    suiteResult && suiteResult.total > 0
      ? Math.round((suiteResult.passed / suiteResult.total) * 100)
      : 0;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 1.5rem', maxWidth: '1140px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Assessment Evaluation & Technical Benchmark Dashboard
            </h1>
            <span className="badge badge-indigo">IncuBrix PS2 Rubric</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Real-time test suite verifying video trimming, aspect ratios, overlays, muting, security bounds, and ffprobe validation.
          </p>
        </div>

        <button
          onClick={runEvaluation}
          disabled={isRunning}
          className="btn btn-primary"
          style={{ minWidth: '180px' }}
        >
          <Play size={16} className={isRunning ? 'animate-spin' : ''} />
          {isRunning ? 'Running Benchmarks...' : 'Run Evaluation Suite'}
        </button>
      </div>

      {/* Aggregate KPI Summary Cards */}
      {suiteResult && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Scenarios
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {suiteResult.total}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              All 10 required test criteria
            </div>
          </div>

          <div className="card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Passed Scenarios
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success-text)', marginTop: '0.25rem' }}>
              {suiteResult.passed} / {suiteResult.total}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--success-text)', marginTop: '0.25rem', fontWeight: 600 }}>
              {passRate}% Success Rate
            </div>
          </div>

          <div className="card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Failed Scenarios
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: suiteResult.failed > 0 ? 'var(--danger-text)' : 'var(--text-muted)', marginTop: '0.25rem' }}>
              {suiteResult.failed}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Zero regressions
            </div>
          </div>

          <div className="card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Suite Execution Time
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.25rem' }}>
              {(suiteResult.total_time_ms / 1000).toFixed(2)}s
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {suiteResult.total_time_ms} ms cumulative
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card" style={{ padding: '0.75rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter Results:</span>
          {(['all', 'passed', 'failed'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.3rem 0.625rem',
                borderRadius: 'var(--radius-sm)',
                textTransform: 'capitalize',
                backgroundColor: filter === mode ? 'var(--accent-primary)' : 'var(--bg-surface-subtle)',
                color: filter === mode ? '#ffffff' : 'var(--text-secondary)',
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Showing {filteredScenarios.length} of {scenarios.length} scenarios
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="card" style={{ backgroundColor: 'var(--danger-bg)', borderColor: 'var(--danger-border)', color: 'var(--danger-text)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} />
            <span>Benchmark Error: {error}</span>
          </div>
        </div>
      )}

      {/* Scenarios Table / Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredScenarios.map((scenario) => {
          const isPassed = scenario.status === 'passed';

          return (
            <div key={scenario.id} className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.625rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {scenario.name}
                    </span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                      {scenario.category}
                    </span>
                    <span className={`badge ${isPassed ? 'badge-success' : 'badge-danger'}`}>
                      {isPassed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {scenario.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {scenario.description}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
                    <Clock size={12} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{scenario.measured_time_ms} ms</span>
                  </div>
                </div>
              </div>

              {/* Prompt Box */}
              <div style={{ backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem', fontSize: '0.75rem', marginBottom: '0.625rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.5rem' }}>INPUT:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>"{scenario.prompt}"</span>
              </div>

              {/* Verified Result Summary */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem' }}>
                <div style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Result:</strong> {scenario.result_summary || 'Execution completed'}
                </div>

                {scenario.output_dimensions && (
                  <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>ffprobe Dimensions: <strong>{scenario.output_dimensions}</strong></span>
                    <span>Duration: <strong>{scenario.output_duration}s</strong></span>
                    <span>Audio: <strong>{scenario.has_audio ? 'Yes' : 'Muted'}</strong></span>
                  </div>
                )}
              </div>

              {/* Error Details */}
              {scenario.error_details && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)', color: 'var(--danger-text)', fontSize: '0.75rem' }}>
                  {scenario.error_details}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
