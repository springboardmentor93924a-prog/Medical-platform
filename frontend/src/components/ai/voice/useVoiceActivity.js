import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Real-Time Voice Activity Detection (VAD) & Barge-In Interruption Hook for MediStock Live Voice.
 *
 * Capabilities:
 * 1. Web Audio API RMS energy computation for speech start / silence turn detection.
 * 2. Instant barge-in interruption: detects speech during assistant output and cuts audio off.
 * 3. Continuous local speech recognition with live interim transcript streaming.
 */
export function useVoiceActivity({
  onTurnComplete,
  onBargeIn,
  silenceThresholdMs = 1200,
  speechVolumeThreshold = 18,
}) {
  const [status, setStatus] = useState('LISTENING'); // 'LISTENING' | 'THINKING' | 'SPEAKING' | 'MUTED'
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(10);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const recognitionRef = useRef(null);

  const isSpeakingRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const transcriptBufferRef = useRef('');
  const statusRef = useRef(status);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const cleanUp = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_e) {}
      recognitionRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (_e) {}
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const handleTurnSubmit = useCallback(() => {
    const text = (transcriptBufferRef.current || interimTranscript).trim();
    if (text) {
      setStatus('THINKING');
      transcriptBufferRef.current = '';
      setInterimTranscript('');
      if (onTurnComplete) {
        onTurnComplete(text);
      }
    }
  }, [interimTranscript, onTurnComplete]);

  const startVAD = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const pcmData = new Uint8Array(analyser.frequencyBinCount);

      const checkAudioEnergy = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(pcmData);

        // Calculate average energy
        let sum = 0;
        for (let i = 0; i < pcmData.length; i++) {
          sum += pcmData[i];
        }
        const avg = Math.round(sum / pcmData.length);
        setVolumeLevel(Math.min(100, Math.max(10, avg * 1.5)));

        if (!isMutedRef.current) {
          if (avg > speechVolumeThreshold) {
            // Speech detected
            if (statusRef.current === 'SPEAKING') {
              // BARGE-IN INTERRUPTION: User started speaking while assistant was talking!
              if (onBargeIn) onBargeIn();
              setStatus('LISTENING');
            }

            isSpeakingRef.current = true;
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
          } else if (isSpeakingRef.current) {
            // User went silent after speaking -> schedule turn dispatch
            if (!silenceTimerRef.current && statusRef.current === 'LISTENING') {
              silenceTimerRef.current = setTimeout(() => {
                isSpeakingRef.current = false;
                silenceTimerRef.current = null;
                handleTurnSubmit();
              }, silenceThresholdMs);
            }
          }
        }

        animationFrameRef.current = requestAnimationFrame(checkAudioEnergy);
      };

      checkAudioEnergy();

      // Continuous Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          if (isMutedRef.current) return;
          let currentSpoken = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentSpoken += event.results[i][0].transcript;
          }
          if (currentSpoken.trim()) {
            transcriptBufferRef.current = currentSpoken;
            setInterimTranscript(currentSpoken);
          }
        };

        recognition.onend = () => {
          // Keep recognition alive during session unless unmounted or thinking
          if (statusRef.current !== 'MUTED' && mediaStreamRef.current) {
            try {
              recognition.start();
            } catch (_e) {}
          }
        };

        recognition.onerror = (_e) => {
          // Non-fatal, loop handles restart
        };

        try {
          recognition.start();
        } catch (_e) {}
        recognitionRef.current = recognition;
      }

      setStatus('LISTENING');
    } catch (err) {
      console.error('[useVoiceActivity] Mic setup failed:', err);
      setError('Microphone permission denied or unavailable.');
    }
  }, [handleTurnSubmit, onBargeIn, silenceThresholdMs, speechVolumeThreshold]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !next;
        });
      }
      return next;
    });
  }, []);

  const notifyAssistantSpeaking = useCallback(() => {
    setStatus('SPEAKING');
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    isSpeakingRef.current = false;
  }, []);

  const notifyAssistantFinished = useCallback(() => {
    setStatus('LISTENING');
    transcriptBufferRef.current = '';
    setInterimTranscript('');
  }, []);

  useEffect(() => {
    startVAD();
    return () => {
      cleanUp();
    };
  }, [cleanUp, startVAD]);

  return {
    status,
    setStatus,
    isMuted,
    volumeLevel,
    interimTranscript,
    error,
    toggleMute,
    notifyAssistantSpeaking,
    notifyAssistantFinished,
    stopVAD: cleanUp,
  };
}

