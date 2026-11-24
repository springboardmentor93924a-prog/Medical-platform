import React, { useState, useEffect } from 'react';
import { useAudioRecorder } from './useAudioRecorder';
import { uploadVoiceRecordingForTranscription } from '../../../services/api';
import {
  IconMicrophone,
  IconX,
  IconSend,
  IconRefresh,
  IconCheck,
} from '../../icons/Icons';
import './VoiceNoteRecorder.css';

export default function VoiceNoteRecorder({ onSendVoice, onCancel, autoStart = true }) {
  const {
    isRecording,
    isPaused,
    audioBlob,
    audioUrl,
    timerFormatted,
    audioLevels,
    speechApiTranscript,
    permissionError,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    resetRecorder,
  } = useAudioRecorder();

  const [stage, setStage] = useState('RECORDING'); // 'RECORDING' | 'TRANSCRIBING' | 'REVIEW'
  const [transcribedText, setTranscribedText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState(null);

  useEffect(() => {
    if (autoStart) {
      startRecording();
    }
  }, [autoStart, startRecording]);

  // When audio recording stops and blob becomes available, trigger transcription
  useEffect(() => {
    if (audioBlob && stage === 'RECORDING') {
      handlePerformTranscription(audioBlob);
    }
  }, [audioBlob]);

  const handlePerformTranscription = async (blob) => {
    setStage('TRANSCRIBING');
    setIsTranscribing(true);
    setTranscriptionError(null);

    try {
      // 1. Attempt backend transcription via Whisper API / Local Whisper
      const res = await uploadVoiceRecordingForTranscription(blob, 'voicenote.webm');
      if (res && res.text) {
        setTranscribedText(res.text);
      } else if (speechApiTranscript) {
        // 2. Fall back to browser Web Speech API transcription
        setTranscribedText(speechApiTranscript);
      } else {
        setTranscribedText('');
      }
    } catch (_err) {
      // If backend Whisper is offline/unconfigured, seamlessly use browser speech recognition
      if (speechApiTranscript) {
        setTranscribedText(speechApiTranscript);
      } else {
        setTranscriptionError('Could not automatically transcribe speech. Please type your query or try re-recording.');
        setTranscribedText('');
      }
    } finally {
      setIsTranscribing(false);
      setStage('REVIEW');
    }
  };

  const handleStopAndTranscribe = () => {
    stopRecording();
  };

  const handleSend = () => {
    const text = transcribedText.trim();
    if (!text) return;
    onSendVoice({
      text,
      audioBlob,
      audioUrl,
    });
  };

  const handleRestart = () => {
    resetRecorder();
    setStage('RECORDING');
    setTranscribedText('');
    setTranscriptionError(null);
    startRecording();
  };

  const handleCancel = () => {
    cancelRecording();
    if (onCancel) onCancel();
  };

  return (
    <div className="ms-voice-dock">
      {permissionError && (
        <div className="ms-voice-dock__error">
          <span>{permissionError}</span>
          <button className="ms-voice-btn ms-voice-btn--cancel" onClick={handleCancel}>
            Dismiss
          </button>
        </div>
      )}

      {/* ── STAGE 1: ACTIVE RECORDING ── */}
      {stage === 'RECORDING' && !permissionError && (
        <div className="ms-voice-recording">
          <div className="ms-voice-recording__visualizer">
            {/* Concentric Pulsing Ripples (Reference: Screenshot 3) */}
            <div className={`ms-voice-pulse-ring ms-voice-pulse-ring--1 ${isPaused ? 'paused' : ''}`} />
            <div className={`ms-voice-pulse-ring ms-voice-pulse-ring--2 ${isPaused ? 'paused' : ''}`} />
            <div className={`ms-voice-pulse-ring ms-voice-pulse-ring--3 ${isPaused ? 'paused' : ''}`} />

            <div className="ms-voice-mic-badge">
              <IconMicrophone size={24} color="#0d9488" />
            </div>
          </div>

          {/* Dynamic Frequency Waveform */}
          <div className="ms-voice-wave-bars">
            {audioLevels.map((lvl, idx) => (
              <span
                key={idx}
                className="ms-voice-wave-bar"
                style={{
                  height: isPaused ? '8px' : `${Math.max(10, lvl)}%`,
                  opacity: isPaused ? 0.4 : 0.85,
                }}
              />
            ))}
          </div>

          <div className="ms-voice-recording__info">
            <span className="ms-voice-timer">{timerFormatted}</span>
            <span className="ms-voice-status">
              {isPaused ? 'Recording Paused' : 'Listening... Speak clearly'}
            </span>
          </div>

          {/* Live speech preview if available */}
          {speechApiTranscript && (
            <div className="ms-voice-live-text">
              &ldquo;{speechApiTranscript}&rdquo;
            </div>
          )}

          {/* Controls Bar */}
          <div className="ms-voice-actions">
            {/* Cancel (X) */}
            <button
              className="ms-voice-action-btn ms-voice-action-btn--cancel"
              onClick={handleCancel}
              title="Cancel recording"
              aria-label="Cancel recording"
            >
              <IconX size={16} />
            </button>

            {/* Pause / Resume */}
            <button
              className="ms-voice-action-btn ms-voice-action-btn--pause"
              onClick={isPaused ? resumeRecording : pauseRecording}
              title={isPaused ? 'Resume' : 'Pause'}
              aria-label={isPaused ? 'Resume recording' : 'Pause recording'}
            >
              {isPaused ? '▶' : '❚❚'}
            </button>

            {/* Done / Stop (Checkmark) */}
            <button
              className="ms-voice-action-btn ms-voice-action-btn--done"
              onClick={handleStopAndTranscribe}
              title="Finish & Transcribe"
              aria-label="Finish and transcribe voice recording"
            >
              <IconCheck size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE 2: TRANSCRIBING ── */}
      {stage === 'TRANSCRIBING' && (
        <div className="ms-voice-transcribing">
          <div className="ms-voice-spinner" />
          <p className="ms-voice-transcribing__text">Transcribing your voice note...</p>
        </div>
      )}

      {/* ── STAGE 3: EDIT & CONFIRM TRANSCRIPTION ── */}
      {stage === 'REVIEW' && (
        <div className="ms-voice-review">
          <div className="ms-voice-review__header">
            <span className="ms-voice-review__title">🎙️ Voice Note Review</span>
            <span className="ms-voice-review__hint">You can edit before sending</span>
          </div>

          {audioUrl && (
            <div className="ms-voice-audio-preview">
              <audio controls src={audioUrl} className="ms-voice-audio-element" />
            </div>
          )}

          {transcriptionError && (
            <div className="ms-voice-review__warning">{transcriptionError}</div>
          )}

          <div className="ms-voice-input-wrapper">
            <textarea
              className="ms-voice-review-textarea"
              value={transcribedText}
              onChange={(e) => setTranscribedText(e.target.value)}
              placeholder="Spoken query transcription appears here..."
              rows={2}
              autoFocus
            />
          </div>

          <div className="ms-voice-review-actions">
            <button
              className="ms-voice-btn ms-voice-btn--secondary"
              onClick={handleRestart}
              title="Record again"
            >
              <IconRefresh size={14} />
              <span>Re-record</span>
            </button>

            <button
              className="ms-voice-btn ms-voice-btn--cancel"
              onClick={handleCancel}
            >
              Cancel
            </button>

            <button
              className="ms-voice-btn ms-voice-btn--primary"
              onClick={handleSend}
              disabled={!transcribedText.trim() || isTranscribing}
            >
              <IconSend size={14} />
              <span>Send Query</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

