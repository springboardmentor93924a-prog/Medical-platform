import React, { useState, useRef, useEffect } from 'react';
import { synthesizeSpeechAudio } from '../../../services/api';
import {
  IconVolume,
  IconVolumeMute,
  IconSquare,
  IconRefresh,
} from '../../icons/Icons';
import './SpeechAudioPlayer.css';

/**
 * High-Fidelity Dual-Engine Text-to-Speech Player for MediStock Assistant Responses.
 *
 * Engine A: Cloud OpenAI TTS streaming MP3 bytes via /api/ai/voice/speak.
 * Engine B: Native Web Speech API (window.speechSynthesis) with zero latency & offline resilience.
 */
export default function SpeechAudioPlayer({
  text,
  messageId,
  autoPlay = false,
  onSpeechStart,
  onSpeechEnd,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [engineUsed, setEngineUsed] = useState(null); // 'CLOUD_TTS' | 'BROWSER_TTS'

  const audioElementRef = useRef(null);
  const utteranceRef = useRef(null);
  const audioUrlRef = useRef(null);

  const cleanTextForSpeech = (raw) => {
    if (!raw) return '';
    return raw
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/#+\s*/g, '')
      .replace(/\|[\s\S]*?\|/g, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\n+/g, ' ')
      .trim();
  };

  const stopAllPlayback = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setIsLoading(false);
    if (onSpeechEnd) onSpeechEnd(messageId);
  };

  const handleStartSpeech = async () => {
    const speechText = cleanTextForSpeech(text);
    if (!speechText) return;

    if (isPlaying && !isPaused) {
      // Pause
      if (engineUsed === 'CLOUD_TTS' && audioElementRef.current) {
        audioElementRef.current.pause();
        setIsPaused(true);
      } else if (engineUsed === 'BROWSER_TTS' && 'speechSynthesis' in window) {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
      return;
    }

    if (isPaused) {
      // Resume
      if (engineUsed === 'CLOUD_TTS' && audioElementRef.current) {
        audioElementRef.current.play();
        setIsPaused(false);
      } else if (engineUsed === 'BROWSER_TTS' && 'speechSynthesis' in window) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      }
      return;
    }

    // New playback request
    stopAllPlayback();
    setIsLoading(true);

    // 1. Try Backend Cloud TTS first if cached URL doesn't exist
    let url = audioUrlRef.current;
    if (!url) {
      try {
        url = await synthesizeSpeechAudio(speechText, 'alloy', playbackSpeed);
        if (url) {
          audioUrlRef.current = url;
        }
      } catch (_e) {
        url = null;
      }
    }

    if (url) {
      // Play via HTML5 Audio element
      setEngineUsed('CLOUD_TTS');
      const audio = new Audio(url);
      audio.playbackRate = playbackSpeed;
      audioElementRef.current = audio;

      audio.onplay = () => {
        setIsLoading(false);
        setIsPlaying(true);
        setIsPaused(false);
        if (onSpeechStart) onSpeechStart(messageId);
      };

      audio.onended = () => {
        stopAllPlayback();
      };

      audio.onerror = () => {
        // Fall back to browser TTS if audio streaming fails
        playViaBrowserSynthesis(speechText);
      };

      try {
        await audio.play();
      } catch (_playErr) {
        playViaBrowserSynthesis(speechText);
      }
    } else {
      // 2. Seamlessly fall back to browser Web Speech API
      playViaBrowserSynthesis(speechText);
    }
  };

  const playViaBrowserSynthesis = (cleanText) => {
    if (!('speechSynthesis' in window)) {
      setIsLoading(false);
      return;
    }

    setEngineUsed('BROWSER_TTS');
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = playbackSpeed;
    utterance.pitch = 1.0;
    utteranceRef.current = utterance;

    utterance.onstart = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setIsPaused(false);
      if (onSpeechStart) onSpeechStart(messageId);
    };

    utterance.onend = () => {
      stopAllPlayback();
    };

    utterance.onerror = () => {
      stopAllPlayback();
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleSpeedToggle = (e) => {
    e.stopPropagation();
    const speeds = [1.0, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);

    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = nextSpeed;
    }
  };

  useEffect(() => {
    if (autoPlay && text) {
      handleStartSpeech();
    }
    return () => {
      stopAllPlayback();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, [autoPlay]);

  return (
    <div className={`ms-tts-player ${isPlaying ? 'ms-tts-player--active' : ''}`}>
      {/* Play / Pause / Listen Trigger */}
      <button
        type="button"
        className={`ms-tts-btn ${isPlaying && !isPaused ? 'active' : ''}`}
        onClick={handleStartSpeech}
        disabled={isLoading}
        title={isPlaying && !isPaused ? 'Pause spoken response' : 'Listen to response'}
        aria-label="Listen to response"
      >
        {isLoading ? (
          <span className="ms-tts-spinner" />
        ) : isPlaying && !isPaused ? (
          <>
            <span className="ms-tts-pause-icon">❚❚</span>
            <span>Pause</span>
          </>
        ) : isPaused ? (
          <>
            <IconVolume size={13} />
            <span>Resume</span>
          </>
        ) : (
          <>
            <IconVolume size={13} />
            <span>Listen</span>
          </>
        )}
      </button>

      {/* Animated Soundwave Oscillators while Speaking */}
      {isPlaying && !isPaused && (
        <div className="ms-tts-waveform">
          <span className="ms-tts-bar ms-tts-bar--1" />
          <span className="ms-tts-bar ms-tts-bar--2" />
          <span className="ms-tts-bar ms-tts-bar--3" />
          <span className="ms-tts-bar ms-tts-bar--4" />
        </div>
      )}

      {/* Auxiliary Controls (Visible during playback) */}
      {isPlaying && (
        <div className="ms-tts-controls">
          {/* Replay */}
          <button
            type="button"
            className="ms-tts-aux-btn"
            onClick={() => {
              stopAllPlayback();
              setTimeout(handleStartSpeech, 100);
            }}
            title="Replay from start"
            aria-label="Replay audio"
          >
            <IconRefresh size={12} />
          </button>

          {/* Stop */}
          <button
            type="button"
            className="ms-tts-aux-btn ms-tts-aux-btn--stop"
            onClick={stopAllPlayback}
            title="Stop audio"
            aria-label="Stop audio"
          >
            <IconSquare size={12} />
          </button>

          {/* Speed Toggle */}
          <button
            type="button"
            className="ms-tts-speed-btn"
            onClick={handleSpeedToggle}
            title="Playback speed"
          >
            {playbackSpeed}x
          </button>
        </div>
      )}
    </div>
  );
}

