/**
 * Vosk bridge: loads model, processes audio from renderer, streams recognized words and amplitude.
 * Audio capture happens in the renderer via Web Audio API; PCM data is sent here via IPC.
 */

import { BrowserWindow, ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';
import * as modelManager from './model-manager';
import * as voskNative from './vosk-native';

let isListening = false;
let prompterWindow: BrowserWindow | null = null;
let recognizer: { acceptWaveform: (data: Buffer) => boolean; result: () => string; partialResult: () => string; free: () => void } | null = null;
let model: { free: () => void } | null = null;
let lastText = '';

// Amplitude throttle: send at ~20fps
let lastAmplitudeTime = 0;
const AMPLITUDE_INTERVAL_MS = 50;

// Audio chunk counter for logging
let audioChunkCount = 0;
let lastLogTime = 0;
const LOG_INTERVAL_MS = 3000; // Log stats every 3 seconds

export function setPrompterWindowForVosk(win: BrowserWindow | null): void {
  prompterWindow = win;
}

/** Send word to ALL windows (controller needs it for dictation, prompter for scroll sync). */
function sendWord(word: string): void {
  console.log(`[VoskBridge] 🎤 WORD DETECTED: "${word}"`);
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.voskOnWord, word);
    }
  });
}

function sendStatus(status: 'idle' | 'loading' | 'ready' | 'listening' | 'error', message?: string): void {
  console.log(`[VoskBridge] Status: ${status}${message ? ` — ${message}` : ''}`);
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.voskOnStatus, { status, message });
    }
  });
}

function sendAmplitude(amplitude: number): void {
  const now = Date.now();
  if (now - lastAmplitudeTime < AMPLITUDE_INTERVAL_MS) return;
  lastAmplitudeTime = now;
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.voskOnAmplitude, { amplitude });
    }
  });
}

/** Compute RMS of 16-bit PCM buffer, normalize to 0..1. */
function computeAmplitude(buffer: Buffer): number {
  if (buffer.length < 2) return 0;
  let sum = 0;
  for (let i = 0; i < buffer.length; i += 2) {
    const s = buffer.readInt16LE(i);
    sum += s * s;
  }
  const rms = Math.sqrt(sum / (buffer.length / 2));
  const max = 32768;
  return Math.min(1, rms / max);
}

/** Parse Vosk result JSON and return text (result or partial). */
function getTextFromResult(jsonStr: string): string {
  try {
    const obj = JSON.parse(jsonStr);
    return (obj.text ?? obj.partial ?? '').trim();
  } catch {
    return '';
  }
}

/** Emit words from final/partial result to prompter. */
function emitWords(prevText: string, newText: string): string {
  if (!newText || newText === prevText) return prevText;
  const prevWords = prevText ? prevText.split(/\s+/) : [];
  const newWords = newText.split(/\s+/).filter(Boolean);
  for (let i = prevWords.length; i < newWords.length; i++) {
    sendWord(newWords[i]);
  }
  return newText;
}

/** Process a chunk of 16-bit PCM audio from the renderer. */
function processAudioChunk(data: Buffer): void {
  if (!recognizer || !isListening) return;

  audioChunkCount++;
  const amp = computeAmplitude(data);
  sendAmplitude(amp);

  // Periodic logging of audio stats
  const now = Date.now();
  if (now - lastLogTime >= LOG_INTERVAL_MS) {
    lastLogTime = now;
    console.log(`[VoskBridge] Audio stats: chunks=${audioChunkCount}, bufLen=${data.length}, amplitude=${amp.toFixed(4)}, isListening=${isListening}, hasRecognizer=${!!recognizer}`);
  }

  try {
    if (recognizer.acceptWaveform(data)) {
      const resultStr = recognizer.result();
      const text = getTextFromResult(resultStr);
      console.log(`[VoskBridge] FINAL result: "${text}" (raw: ${resultStr.substring(0, 120)})`);
      lastText = emitWords(lastText, text);
    } else {
      const partialStr = recognizer.partialResult();
      const text = getTextFromResult(partialStr);
      if (text) {
        // Only log when partial text changes
        if (text !== lastText) {
          console.log(`[VoskBridge] PARTIAL result: "${text}"`);
        }
        lastText = emitWords(lastText, text);
      }
    }
  } catch (err) {
    console.error('[VoskBridge] Error processing audio chunk:', err);
  }
}

/** Register the IPC listener for incoming audio data from the renderer. */
export function registerAudioIpc(): void {
  console.log('[VoskBridge] Registering audio IPC listener');
  ipcMain.on(IPC_CHANNELS.voskAudioData, (_event, data: Uint8Array | Buffer) => {
    // Electron IPC may deliver Uint8Array instead of Buffer — ensure it's a proper Buffer
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    processAudioChunk(buf);
  });
}

export async function startVosk(language: string): Promise<void> {
  if (isListening) {
    console.log('[VoskBridge] Already listening, ignoring start');
    return;
  }
  sendStatus('loading');

  if (!modelManager.isModelDownloaded(language)) {
    console.log('[VoskBridge] Model not downloaded for', language, '— running in WPM-only stub mode');
    isListening = true;
    sendStatus('ready');
    sendStatus('listening');
    return;
  }

  const modelPath = modelManager.getModelDir(language);
  console.log('[VoskBridge] Starting Vosk with model at', modelPath);

  try {
    const SAMPLE_RATE = 16000;

    voskNative.setLogLevel(0); // Enable Vosk logs for debugging
    model = new voskNative.Model(modelPath);
    console.log('[VoskBridge] Model loaded OK');
    recognizer = new voskNative.Recognizer({ model, sampleRate: SAMPLE_RATE });
    console.log('[VoskBridge] Recognizer created OK');
    lastText = '';
    audioChunkCount = 0;
    lastLogTime = Date.now();

    isListening = true;
    sendStatus('ready');
    sendStatus('listening');
    console.log('[VoskBridge] Vosk started — waiting for audio from renderer');
  } catch (err) {
    console.error('[VoskBridge] Vosk startup FAILED:', err);
    isListening = true;
    sendStatus('ready');
    sendStatus('listening');
  }
}

function cleanup(): void {
  try {
    if (recognizer) {
      recognizer.free();
      recognizer = null;
    }
  } catch {
    recognizer = null;
  }
  try {
    if (model) {
      model.free();
      model = null;
    }
  } catch {
    model = null;
  }
}

export function stopVosk(): void {
  if (!isListening) return;
  console.log(`[VoskBridge] Stopping Vosk (processed ${audioChunkCount} chunks)`);
  isListening = false;
  lastText = '';
  cleanup();
  sendStatus('idle');
}

export function isVoskListening(): boolean {
  return isListening;
}
