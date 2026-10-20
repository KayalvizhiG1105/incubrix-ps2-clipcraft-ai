import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Film } from 'lucide-react';
import type { MediaMetadata } from '../types';

interface VideoPreviewProps {
  videoUrl: string | null;
  metadata: MediaMetadata | null;
  label?: string;
  isProcessed?: boolean;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoUrl,
  metadata,
  label = 'Original Video',
  isProcessed = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [videoUrl]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!videoUrl) {
    return (
      <div
        className="card"
        style={{
          height: '320px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#94a3b8',
          border: '1px solid #1e293b',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '1.25rem',
        }}
      >
        <Film size={42} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#e2e8f0' }}>No video loaded</div>
        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
          Upload a video or click "Load Sample Video" to start previewing
        </div>
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        padding: '0.75rem',
        backgroundColor: '#020617',
        color: '#f8fafc',
        borderRadius: 'var(--radius-lg)',
        border: isProcessed ? '1px solid var(--accent-primary)' : '1px solid #1e293b',
        boxShadow: isProcessed ? '0 0 15px rgba(99, 102, 241, 0.2)' : 'var(--shadow-md)',
        marginBottom: '1.25rem',
      }}
    >
      {/* Video Header Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.25rem 0.5rem 0.625rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: isProcessed ? '#818cf8' : '#94a3b8',
            }}
          >
            {label}
          </span>
          {isProcessed && (
            <span className="badge badge-indigo" style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}>
              Edited Output
            </span>
          )}
        </div>

        {metadata && (
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.7rem', color: '#94a3b8' }}>
            <span>{metadata.width}×{metadata.height}</span>
            <span>•</span>
            <span>{metadata.aspect_ratio}</span>
            <span>•</span>
            <span>{metadata.duration}s</span>
          </div>
        )}
      </div>

      {/* HTML5 Video Display with Centered Aspect Ratio */}
      <div
        style={{
          position: 'relative',
          backgroundColor: '#000000',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          maxHeight: '420px',
          minHeight: '260px',
        }}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onClick={togglePlay}
          playsInline
          style={{
            maxWidth: '100%',
            maxHeight: '420px',
            objectFit: 'contain',
            cursor: 'pointer',
          }}
        />
      </div>

      {/* Custom Video Controls Bar */}
      <div style={{ padding: '0.625rem 0.5rem 0.25rem' }}>
        {/* Scrubber Range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#94a3b8', minWidth: '42px' }}>
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || metadata?.duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            style={{
              flex: 1,
              height: '5px',
              accentColor: 'var(--accent-primary)',
              cursor: 'pointer',
            }}
          />
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#94a3b8', minWidth: '42px', textAlign: 'right' }}>
            {formatTime(duration || metadata?.duration || 0)}
          </span>
        </div>

        {/* Buttons Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={togglePlay}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} style={{ marginLeft: '2px' }} />}
            </button>

            <button
              onClick={toggleMute}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Fullscreen"
          >
            <Maximize2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
