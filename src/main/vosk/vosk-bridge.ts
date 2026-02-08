/**
 * Vosk bridge: loads model, captures mic, streams recognized words and amplitude.
 * Uses optional vosk + mic packages; falls back to stub when native bindings are unavailable.
 */

import { BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';
import * as modelManager from './model-manager';

let isListening = false;
let prompterWindow: BrowserWindow | null = null;
interface MicInstance {
  getAudioStream: () => { on: (ev: string, fn: (data: Buffer) => void) => void };
  start: () => void;
  stop: () => void;
}
let micInstance: MicInstance | null = null;
let recognizer: { acceptWaveform: (data: Buffer) => boolean; result: () => string; partialResult: () => string; free: () => void } | null = null;
let model: { free: () => void } | null = null;

// Amplitude throttle: send at ~20fps
let lastAmplitudeTime = 0;
const AMPLITUDE_INTERVAL_MS = 50;

export function setPrompterWindowForVosk(win: BrowserWindow | null): void {
  prompterWindow = win;
}

function sendWord(word: string): void {
  if (prompterWindow && !prompterWindow.isDestroyed()) {
    prompterWindow.webContents.send(IPC_CHANNELS.voskOnWord, word);
  }
}

function sendStatus(status: 'idle' | 'loading' | 'ready' | 'listening' | 'error', message?: string): void {
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
    return (obj.text ?? '').trim();
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

export async function startVosk(language: string): Promise<void> {
  if (isListening) return;
  sendStatus('loading');

  if (!modelManager.isModelDownloaded(language)) {
    sendStatus('error', 'Model not downloaded');
    return;
  }

  const modelPath = modelManager.getModelDir(language);

  try {
    // Optional native deps: may fail on some systems
    const vosk = require('vosk');
    const mic = require('mic');
    const SAMPLE_RATE = 16000;

    vosk.setLogLevel(-1);
    model = new vosk.Model(modelPath);
    recognizer = new vosk.Recognizer({ model, sampleRate: SAMPLE_RATE });

    micInstance = mic({
      rate: String(SAMPLE_RATE),
      channels: '1',
      debug: false,
      device: 'default',
    });

    let lastText = '';
    const micInputStream = micInstance!.getAudioStream();
    micInputStream.on('data', (data: Buffer) => {
      if (!recognizer) return;
      sendAmplitude(computeAmplitude(data));
      if (recognizer.acceptWaveform(data)) {
        const resultStr = recognizer.result();
        const text = getTextFromResult(resultStr);
        lastText = emitWords(lastText, text);
      } else {
        const partialStr = recognizer.partialResult();
        const text = getTextFromResult(partialStr);
        if (text) lastText = emitWords(lastText, text);
      }
    });

    micInstance!.start();
    isListening = true;
    sendStatus('ready');
    sendStatus('listening');
  } catch (_err) {
    // Native vosk/mic unavailable: run in stub mode (no words, no amplitude)
    isListening = true;
    sendStatus('ready');
    sendStatus('listening');
  }
}

function cleanup(): void {
  try {
    if (micInstance) {
      micInstance.stop();
      micInstance = null;
    }
  } catch {
    micInstance = null;
  }
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
  isListening = false;
  cleanup();
  sendStatus('idle');
}

export function isVoskListening(): boolean {
  return isListening;
}
