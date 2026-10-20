import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { EditorView } from './views/EditorView';
import { HistoryView } from './views/HistoryView';
import { EvaluationView } from './views/EvaluationView';
import { DocsView } from './views/DocsView';
import type { NavTab, MediaMetadata, SessionHistoryItem } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('editor');
  const [projectTitle, setProjectTitle] = useState('My ClipCraft Project');

  // Video State
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  // System Health
  const [systemHealth, setSystemHealth] = useState<{ status: string; ffmpeg: string; ffprobe: string } | null>(null);

  useEffect(() => {
    // Check backend health
    api.checkHealth()
      .then((data) => setSystemHealth(data))
      .catch((err) => {
        console.warn('Backend health check error:', err);
      });
  }, []);

  // Handle File Upload
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const res = await api.uploadVideo(file, (pct) => setUploadProgress(pct));
      setMetadata(res.metadata);
      setVideoUrl(res.video_url);
      setVideoId(res.video_id);
      setProjectTitle(`Edit: ${res.original_filename.replace(/\.[^/.]+$/, '')}`);
    } catch (err: any) {
      setUploadError(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Loading Demo Sample Video
  const handleLoadSample = async () => {
    setIsLoadingSample(true);
    setUploadError(null);

    try {
      const res = await api.loadSampleVideo();
      setMetadata(res.metadata);
      setVideoUrl(res.video_url);
      setVideoId(res.video_id);
      setProjectTitle('Sample Travel Clip Demo');
      if (currentTab !== 'editor') {
        setCurrentTab('editor');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to load demo sample video');
    } finally {
      setIsLoadingSample(false);
    }
  };

  // Reset Project / Session
  const handleResetSession = () => {
    setMetadata(null);
    setVideoUrl(null);
    setVideoId(null);
    setUploadError(null);
    setProjectTitle('My ClipCraft Project');
  };

  // Reopen session from History
  const handleLoadSessionInEditor = (session: SessionHistoryItem) => {
    setVideoId(session.video_id);
    setVideoUrl(session.output_url || `/api/media/uploads/${session.video_id}`);
    setMetadata(session.input_metadata || null);
    setProjectTitle(session.project_title || 'Reloaded Project');
    setCurrentTab('editor');
  };

  return (
    <div className="app-layout">
      {/* Left Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        systemHealth={systemHealth}
      />

      {/* Main Workspace Frame */}
      <div className="main-content">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          projectTitle={projectTitle}
          onUpdateTitle={setProjectTitle}
          onResetSession={handleResetSession}
          onLoadSample={handleLoadSample}
          isLoadingSample={isLoadingSample}
          isProcessing={isUploading}
        />

        {/* View Router */}
        {currentTab === 'editor' && (
          <EditorView
            projectTitle={projectTitle}
            metadata={metadata}
            videoUrl={videoUrl}
            videoId={videoId}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            uploadError={uploadError}
            onFileUpload={handleFileUpload}
            onLoadSample={handleLoadSample}
            onResetSession={handleResetSession}
          />
        )}

        {currentTab === 'history' && (
          <HistoryView
            onLoadSessionInEditor={handleLoadSessionInEditor}
          />
        )}

        {currentTab === 'evaluation' && (
          <EvaluationView />
        )}

        {currentTab === 'docs' && (
          <DocsView />
        )}
      </div>
    </div>
  );
};

export default App;
