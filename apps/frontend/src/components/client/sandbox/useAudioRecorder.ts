import { useState, useRef, useCallback } from 'react';
import { uploadBase64, readAsDataURL } from './sandboxActions.js';

interface UseAudioRecorderOptions {
  clientToken?: string;
  /** Called when the audio blob is uploaded successfully. */
  onUploaded: (url: string) => void;
}

/**
 * Manages the audio recording flow: requests mic access, records into
 * an in-memory chunk list, and on stop uploads the blob to the server.
 */
export function useAudioRecorder({ clientToken, onUploaded }: UseAudioRecorderOptions) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const base64 = await readAsDataURL(blob);
        if (!clientToken) return;
        setUploading(true);
        try {
          const result = await uploadBase64(base64, clientToken);
          if (result.success && result.url) onUploaded(result.url);
          else alert(result.error || 'Upload failed');
        } finally {
          setUploading(false);
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch (err) {
      alert('Microphone access denied: ' + String(err));
    }
  }, [clientToken, onUploaded]);

  const toggle = useCallback(() => {
    if (recording) stop();
    else void start();
  }, [recording, start, stop]);

  return { recording, uploading, toggle };
}
