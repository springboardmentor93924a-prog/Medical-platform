import React, { useState, useEffect, useRef } from 'react';
import { useVoiceActivity } from './useVoiceActivity';
import {
  createLiveVoiceSession,
  closeLiveVoiceSession,
  sendVoiceChatMessage,
  synthesizeSpeechAudio,
} from '../../../services/api';
import {
  IconMicrophone,
  IconVolumeMute,
  IconX,
  IconSparkles,
} from '../../icons/Icons';
import './LiveVoiceModal.css';

export default function LiveVoiceModal({
  isOpen,
  onClose,
  sessionId,
  onSessionMessage,
}) {
  const [liveSessionId, setLiveSessionId] = useState(null);
  const [activeChatSessionId, setActiveChatSessionId] = useState(sessionId);
  const [lastUserQuery, setLastUserQuery] = useState('');
  const [lastAssistantReply, setLastAssistantReply] = useState('');
  const [toolCard, setToolCard] = useState(null);
  const currentAudioRef = useRef(null);

  useEffect(() => {
    setActiveChatSessionId(sessionId);
  }, [sessionId]);

  const stopCurrentSpeech = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleBargeIn = () => {
    // User spoke while assistant was talking -> immediately halt audio!
    stopCurrentSpeech();
  };

  const handleTurnComplete = async (spokenText) => {
    if (!spokenText || !spokenText.trim()) return;

    setLastUserQuery(spokenText);
    setToolCard(null);

    if (onSessionMessage) {
      onSessionMessage({
        id: 'usr_' + Date.now(),
        sender: 'USER',
        text: spokenText,
        isVoice: true,
      });
    }

    try {
      const targetSessionId = activeChatSessionId || sessionId;
      const res = await sendVoiceChatMessage(targetSessionId, spokenText, 'en', true);
      if (res && res.reply) {
        if (res.sessionId) {
          setActiveChatSessionId(res.sessionId);
        }
        setLastAssistantReply(res.reply);
        if (res.toolUsed && res.toolData) {
          setToolCard({ toolUsed: res.toolUsed, toolData: res.toolData });
        }

        if (onSessionMessage) {
          onSessionMessage({
            id: 'asst_' + Date.now(),
            sender: 'ASSISTANT',
            text: res.reply,
            toolUsed: res.toolUsed,
            toolData: res.toolData,
            provider: res.provider,
          }, res.sessionId);
        }

        // Auto-speak response in Live Voice Mode
        notifyAssistantSpeaking();
        await playSpeechResponse(res.reply);
      } else {
        notifyAssistantFinished();
      }
    } catch (err) {
      console.error('[LiveVoice] Turn error:', err);
      notifyAssistantFinished();
    }
  };

  const {
    status,
    isMuted,
    volumeLevel,
    interimTranscript,
    error,
    toggleMute,
    notifyAssistantSpeaking,
    notifyAssistantFinished,
    stopVAD,
  } = useVoiceActivity({
    onTurnComplete: handleTurnComplete,
    onBargeIn: handleBargeIn,
    silenceThresholdMs: 1200,
    speechVolumeThreshold: 18,
  });

  const playSpeechResponse = async (text) => {
    stopCurrentSpeech();

    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/#+\s*/g, '')
      .replace(/\|[\s\S]*?\|/g, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    if (!cleanText) {
      notifyAssistantFinished();
      return;
    }

    // 1. Try Backend Cloud TTS first
    try {
      const audioUrl = await synthesizeSpeechAudio(cleanText, 'alloy', 1.05);
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;

        audio.onended = () => {
          currentAudioRef.current = null;
          notifyAssistantFinished();
        };
        audio.onerror = () => {
          fallbackBrowserSpeech(cleanText);
        };

        await audio.play();
        return;
      }
    } catch (_e) {
      // Fall through to browser speech synthesis
    }

    // 2. Seamless local fallback
    fallbackBrowserSpeech(cleanText);
  };

  const fallbackBrowserSpeech = (cleanText) => {
    if (!('speechSynthesis' in window)) {
      notifyAssistantFinished();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onend = () => notifyAssistantFinished();
    utterance.onerror = () => notifyAssistantFinished();

    window.speechSynthesis.speak(utterance);
  };

  // Live session lifecycle
  useEffect(() => {
    if (isOpen) {
      createLiveVoiceSession('LIVE_VOICE')
        .then((sess) => {
          if (sess && sess.sessionId) setLiveSessionId(sess.sessionId);
        })
        .catch((_e) => {});
    }

    return () => {
      stopCurrentSpeech();
      stopVAD();
      if (liveSessionId) {
        closeLiveVoiceSession(liveSessionId).catch(() => {});
      }
    };
  }, [isOpen]);

  const handleClose = () => {
    stopCurrentSpeech();
    stopVAD();
    if (liveSessionId) {
      closeLiveVoiceSession(liveSessionId).catch(() => {});
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="ms-live-overlay" onClick={handleClose}>
      <div className="ms-live-modal" onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div className="ms-live-modal__header">
          <div className="ms-live-modal__branding">
            <IconSparkles size={18} color="#00f2fe" />
            <span className="ms-live-modal__title">MediStock Live Voice</span>
          </div>
          <button
            className="ms-live-close-btn"
            onClick={handleClose}
            aria-label="Exit live voice"
            title="Exit live voice mode"
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Central Orb Area (Reference: Screenshot 5) */}
        <div className="ms-live-body">
          <div className="ms-live-status-badge">
            <span className={`ms-live-status-dot ms-live-status-dot--${status.toLowerCase()}`} />
            <span className="ms-live-status-text">
              {status === 'LISTENING' && (isMuted ? 'Microphone Muted' : 'Listening...')}
              {status === 'THINKING' && 'Thinking...'}
              {status === 'SPEAKING' && 'MediStock AI Speaking...'}
            </span>
          </div>

          {/* Living 3D Dynamic Fluid Orb */}
          <div className="ms-live-orb-container">
            <div
              className={`ms-live-orb ms-live-orb--${status.toLowerCase()} ${isMuted ? 'muted' : ''}`}
              style={{
                transform: `scale(${1 + (volumeLevel / 100) * 0.25})`,
              }}
            >
              <div className="ms-live-orb__inner" />
              <div className="ms-live-orb__flare" />
              <div className="ms-live-orb__glow" />
            </div>
          </div>

          {/* Real-Time Subtitle Stream */}
          <div className="ms-live-subtitles">
            {interimTranscript ? (
              <p className="ms-live-subtitles__user">
                &ldquo;{interimTranscript}&rdquo;
              </p>
            ) : status === 'SPEAKING' && lastAssistantReply ? (
              <p className="ms-live-subtitles__ai">
                {lastAssistantReply.length > 140
                  ? lastAssistantReply.substring(0, 140) + '...'
                  : lastAssistantReply}
              </p>
            ) : lastUserQuery ? (
              <p className="ms-live-subtitles__prev">
                &ldquo;{lastUserQuery}&rdquo;
              </p>
            ) : (
              <p className="ms-live-subtitles__prompt">
                Speak naturally to MediStock AI...
              </p>
            )}
          </div>

          {/* Optional Tool Summary Card */}
          {toolCard && (
            <div className="ms-live-tool-chip">
              <span className="ms-live-tool-chip__badge">Live Data Verified</span>
              <span className="ms-live-tool-chip__label">
                Queried {toolCard.toolUsed.replace(/_/g, ' ')}
              </span>
            </div>
          )}

          {error && <div className="ms-live-error">{error}</div>}
        </div>

        {/* Bottom Control Dock (Screenshot 5 Reference) */}
        <div className="ms-live-dock">
          {/* Mute Toggle */}
          <button
            className={`ms-live-dock-btn ${isMuted ? 'active-mute' : ''}`}
            onClick={toggleMute}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            aria-label="Toggle mute"
          >
            {isMuted ? <IconVolumeMute size={22} /> : <IconMicrophone size={22} />}
          </button>

          {/* End Session Button */}
          <button
            className="ms-live-dock-btn ms-live-dock-btn--exit"
            onClick={handleClose}
            title="End live voice conversation"
            aria-label="End conversation"
          >
            <IconX size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

