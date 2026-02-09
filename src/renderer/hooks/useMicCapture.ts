/**
 * Web Audio API microphone capture hook.
 * Captures audio from the selected device, converts to 16-bit PCM at 16kHz,
 * and sends it to the main process via IPC for Vosk processing.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useIpc } from './useIpc';

const TARGET_SAMPLE_RATE = 16000;

export interface MicDevice {
  deviceId: string;
  label: string;
}

/**
 * Enumerate available audio input devices.
 * Must be called after getUserMedia has been granted at least once.
 */
export async function enumerateAudioInputs(): Promise<MicDevice[]> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter((d) => d.kind === 'audioinput')
      .map((d) => ({
        deviceId: d.deviceId,
        label: d.label || `Microphone ${d.deviceId.slice(0, 8)}`,
      }));
  } catch {
    return [];
  }
}

/**
 * Hook that manages mic capture lifecycle.
 * Returns controls to start/stop capture and the list of available devices.
 */
export function useMicCapture() {
  const ipc = useIpc();
  const [devices, setDevices] = useState<MicDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(() => {
    try { return localStorage.getItem('notchprompter:mic-device') || ''; } catch { return ''; }
  });
  const [isCapturing, setIsCapturing] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // Persist selected device
  useEffect(() => {
    try { localStorage.setItem('notchprompter:mic-device', selectedDeviceId); } catch { /* noop */ }
  }, [selectedDeviceId]);

  // Refresh device list
  const refreshDevices = useCallback(async () => {
    // Request permission first (needed to get labels)
    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      tempStream.getTracks().forEach((t) => t.stop());
    } catch {
      // permission denied or no devices
    }
    const devs = await enumerateAudioInputs();
    console.log('[MicCapture] Devices found:', devs.map((d) => `${d.label} (${d.deviceId.slice(0, 12)}…)`));
    setDevices(devs);
    // Auto-select first device if none selected
    if (!selectedDeviceId && devs.length > 0) {
      setSelectedDeviceId(devs[0].deviceId);
    }
    return devs;
  }, [selectedDeviceId]);

  // Load devices on mount
  useEffect(() => {
    refreshDevices();
  }, []);

  const startCapture = useCallback(async (deviceId?: string) => {
    if (isCapturing) return;
    const useDeviceId = deviceId || selectedDeviceId;

    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          ...(useDeviceId ? { deviceId: { exact: useDeviceId } } : {}),
          sampleRate: TARGET_SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Create AudioContext at the target sample rate
      const ctx = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });
      contextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);

      // Use ScriptProcessorNode for broad compatibility (AudioWorklet would be better but needs more setup)
      const bufferSize = 4096;
      const processor = ctx.createScriptProcessor(bufferSize, 1, 1);
      processorRef.current = processor;

      let chunkCount = 0;
      processor.onaudioprocess = (event) => {
        if (!ipc) return;
        const float32 = event.inputBuffer.getChannelData(0);

        // Resample if context sample rate differs from target
        let samples = float32;
        if (ctx.sampleRate !== TARGET_SAMPLE_RATE) {
          const ratio = ctx.sampleRate / TARGET_SAMPLE_RATE;
          const newLen = Math.round(float32.length / ratio);
          const resampled = new Float32Array(newLen);
          for (let i = 0; i < newLen; i++) {
            const srcIdx = Math.min(Math.round(i * ratio), float32.length - 1);
            resampled[i] = float32[srcIdx];
          }
          samples = resampled;
        }

        // Convert float32 [-1, 1] to int16 PCM
        const pcm16 = new Int16Array(samples.length);
        for (let i = 0; i < samples.length; i++) {
          const s = Math.max(-1, Math.min(1, samples[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        chunkCount++;
        if (chunkCount === 1 || chunkCount % 50 === 0) {
          // Compute simple RMS for logging
          let sum = 0;
          for (let i = 0; i < float32.length; i++) sum += float32[i] * float32[i];
          const rms = Math.sqrt(sum / float32.length);
          console.log(`[MicCapture] Chunk #${chunkCount}: ctxRate=${ctx.sampleRate}, samples=${samples.length}, pcmBytes=${pcm16.byteLength}, rms=${rms.toFixed(6)}`);
        }

        ipc.sendAudioData(pcm16.buffer);
      };

      source.connect(processor);
      processor.connect(ctx.destination); // Required for ScriptProcessorNode to fire

      setIsCapturing(true);
      const track = stream.getAudioTracks()[0];
      const trackSettings = track?.getSettings();
      console.log('[MicCapture] Started capturing:', {
        device: useDeviceId || 'default',
        trackLabel: track?.label,
        trackSampleRate: trackSettings?.sampleRate,
        contextSampleRate: ctx.sampleRate,
        contextState: ctx.state,
        bufferSize,
      });
    } catch (err) {
      console.error('[MicCapture] Failed to start capture:', err);
    }
  }, [ipc, isCapturing, selectedDeviceId]);

  const stopCapture = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (contextRef.current) {
      contextRef.current.close().catch(() => {});
      contextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
    console.log('[MicCapture] Stopped');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (contextRef.current) {
        contextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    isCapturing,
    startCapture,
    stopCapture,
    refreshDevices,
  };
}
