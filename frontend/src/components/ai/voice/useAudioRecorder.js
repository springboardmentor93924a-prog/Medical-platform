import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom React hook for capturing microphone audio, tracking recording duration,
 * streaming volume levels for visual waveform animations, and running Web Speech fallback.
 */
export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [audioLevels, setAudioLevels] = useState([15, 25, 40, 60, 45, 30, 20]);
  const [speechApiTranscript, setSpeechApiTranscript] = useState('');
  const [permissionError, setPermissionError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const streamRef = useRef(null);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const cleanUpAudioContext = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (_e) {
        // ignore
      }
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setPermissionError(null);
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setSpeechApiTranscript('');
    setDuration(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Determine supported mime-type
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(finalBlob);
        setAudioUrl(URL.createObjectURL(finalBlob));
        cleanUpAudioContext();
      };

      recorder.start(100); // 100ms chunks for smooth recording
      setIsRecording(true);
      setIsPaused(false);

      // Start duration timer
      timerIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      // Audio analysis for animated waveform
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 32;
        source.connect(analyser);
        analyserRef.current = analyser;

        const updateLevels = () => {
          if (!analyserRef.current) return;
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);

          // Sample 7 distinct frequency bands for waveform animation
          const sampled = [
            Math.max(10, Math.round((dataArray[1] / 255) * 100)),
            Math.max(15, Math.round((dataArray[3] / 255) * 100)),
            Math.max(20, Math.round((dataArray[5] / 255) * 100)),
            Math.max(25, Math.round((dataArray[7] / 255) * 100)),
            Math.max(20, Math.round((dataArray[9] / 255) * 100)),
            Math.max(15, Math.round((dataArray[11] / 255) * 100)),
            Math.max(10, Math.round((dataArray[13] / 255) * 100)),
          ];
          setAudioLevels(sampled);
          animationFrameRef.current = requestAnimationFrame(updateLevels);
        };
        updateLevels();
      }

      // Initiate parallel Web Speech Recognition for instant local transcription fallback
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event) => {
            let combined = '';
            for (let i = 0; i < event.results.length; ++i) {
              combined += event.results[i][0].transcript;
            }
            if (combined.trim()) {
              setSpeechApiTranscript(combined.trim());
            }
          };

          recognition.onerror = (_e) => {
            // Non-fatal, backend Whisper will handle audio if browser STT errors
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (_e) {
          // Ignore if already active or unsupported
        }
      }
    } catch (err) {
      console.error('[useAudioRecorder] Mic access denied or failed:', err);
      setPermissionError('Microphone access was denied. Please allow microphone permissions in your browser.');
      setIsRecording(false);
    }
  }, [audioUrl, cleanUpAudioContext]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (_e) {}
      speechRecognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    setIsPaused(false);
  }, []);

  const cancelRecording = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (_e) {}
      speechRecognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    cleanUpAudioContext();
    audioChunksRef.current = [];
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setDuration(0);
    setIsRecording(false);
    setIsPaused(false);
    setSpeechApiTranscript('');
    setPermissionError(null);
  }, [audioUrl, cleanUpAudioContext]);

  const resetRecorder = useCallback(() => {
    cancelRecording();
  }, [cancelRecording]);

  useEffect(() => {
    return () => {
      cancelRecording();
    };
  }, [cancelRecording]);

  return {
    isRecording,
    isPaused,
    audioBlob,
    audioUrl,
    duration,
    timerFormatted: formatTimer(duration),
    audioLevels,
    speechApiTranscript,
    permissionError,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    resetRecorder,
  };
}

