import React, { useState, useEffect } from 'react';
import { VideoUpload } from '../components/VideoUpload';
import { VideoPreview } from '../components/VideoPreview';
import { PromptComposer } from '../components/PromptComposer';
import { OperationsReview } from '../components/OperationsReview';
import { OutputPanel } from '../components/OutputPanel';
import { RightPanel } from '../components/RightPanel';
import type { MediaMetadata, Operation } from '../types';
import { api } from '../services/api';

interface EditorViewProps {
  projectTitle: string;
  metadata: MediaMetadata | null;
  videoUrl: string | null;
  videoId: string | null;
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  onFileUpload: (file: File) => void;
  onLoadSample: () => void;
  onResetSession: () => void;
}

export const EditorView: React.FC<EditorViewProps> = ({
  projectTitle,
  metadata,
  videoUrl,
  videoId,
  isUploading,
  uploadProgress,
  uploadError,
  onFileUpload,
  onLoadSample,
}) => {
  const [prompt, setPrompt] = useState('');
  const [operations, setOperations] = useState<Operation[]>([]);
  const [explanations, setExplanations] = useState<string[]>([]);
  const [unsupportedIntents, setUnsupportedIntents] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Render execution state
  const [isRendering, setIsRendering] = useState(false);
  const [renderElapsedSec, setRenderElapsedSec] = useState(0);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Output state
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [outputMetadata, setOutputMetadata] = useState<MediaMetadata | null>(null);
  const [processingTimeMs, setProcessingTimeMs] = useState<number | null>(null);

  // Render elapsed timer
  useEffect(() => {
    let interval: any = null;
    if (isRendering) {
      setRenderElapsedSec(0);
      interval = setInterval(() => {
        setRenderElapsedSec((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRendering]);

  // Handle Prompt Interpretation
  const handleParsePrompt = async () => {
    if (!prompt.trim()) return;
    setIsParsing(true);
    setParseError(null);
    setUnsupportedIntents([]);

    try {
      const res = await api.parsePrompt(prompt, metadata?.duration);
      if (res.success) {
        setOperations(res.operations);
        setExplanations(res.explanations);
        setUnsupportedIntents([]);
      } else {
        setOperations([]);
        setExplanations([]);
        setUnsupportedIntents(res.unsupported_intents);
        setParseError(res.error || 'Could not interpret instruction');
      }
    } catch (err: any) {
      setParseError(err.message || 'Error communicating with parser');
    } finally {
      setIsParsing(false);
    }
  };

  // Remove individual operation
  const handleRemoveOperation = (index: number) => {
    const updatedOps = [...operations];
    const updatedExpl = [...explanations];
    updatedOps.splice(index, 1);
    updatedExpl.splice(index, 1);
    setOperations(updatedOps);
    setExplanations(updatedExpl);
  };

  // Execute Render
  const handleRender = async () => {
    if (!videoId || operations.length === 0) return;
    setIsRendering(true);
    setRenderError(null);
    setOutputUrl(null);
    setOutputMetadata(null);

    try {
      const res = await api.renderVideo({
        video_id: videoId,
        project_title: projectTitle,
        prompt: prompt,
        operations: operations,
      });

      setOutputUrl(res.output_url || null);
      setDownloadUrl(res.download_url || null);
      setOutputMetadata(res.output_metadata || null);
      setProcessingTimeMs(res.processing_time_ms || null);
    } catch (err: any) {
      setRenderError(err.message || 'Video rendering failed');
    } finally {
      setIsRendering(false);
    }
  };

  const handleResetOutputOnly = () => {
    setOutputUrl(null);
    setOutputMetadata(null);
    setDownloadUrl(null);
    setProcessingTimeMs(null);
  };

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
      {/* Center Editing Area */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Upload Area */}
        <VideoUpload
          metadata={metadata}
          videoUrl={videoUrl}
          onFileUpload={onFileUpload}
          onLoadSample={onLoadSample}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          uploadError={uploadError}
        />

        {/* Input Video Player Preview */}
        {videoUrl && !outputUrl && (
          <VideoPreview
            videoUrl={videoUrl}
            metadata={metadata}
            label="Input Video Player"
          />
        )}

        {/* Natural Language Prompt Composer */}
        <PromptComposer
          prompt={prompt}
          onPromptChange={setPrompt}
          onSubmit={handleParsePrompt}
          onClear={() => {
            setPrompt('');
            setOperations([]);
            setExplanations([]);
            setUnsupportedIntents([]);
            setParseError(null);
          }}
          isParsing={isParsing}
          hasVideo={!!videoUrl}
          parseError={parseError}
        />

        {/* Planned Operations Review & Render Action */}
        <OperationsReview
          operations={operations}
          explanations={explanations}
          unsupportedIntents={unsupportedIntents}
          onRemoveOperation={handleRemoveOperation}
          onRender={handleRender}
          isRendering={isRendering}
          renderElapsedSec={renderElapsedSec}
          renderError={renderError}
          hasVideo={!!videoUrl}
        />

        {/* Rendered Output Panel */}
        {outputUrl && outputMetadata && (
          <OutputPanel
            outputUrl={outputUrl}
            downloadUrl={downloadUrl}
            outputMetadata={outputMetadata}
            processingTimeMs={processingTimeMs}
            originalVideoUrl={videoUrl}
            originalMetadata={metadata}
            onReset={handleResetOutputOnly}
          />
        )}
      </main>

      {/* Right Side Inspector & Pipeline Summary */}
      <RightPanel
        metadata={metadata}
        operations={operations}
        onPromptClick={(samplePrompt) => {
          setPrompt(samplePrompt);
        }}
      />
    </div>
  );
};
