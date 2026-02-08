/**
 * Vosk bridge: loads model, captures mic, streams recognized words.
 * Stub implementation until Vosk model and native bindings are integrated.
 * Main process sends words via ipcMain + webContents.send to renderer.
 */

import { BrowserWindow } from 'electron';

let isListening = false;
let prompterWindow: BrowserWindow | null = null;

export function setPrompterWindowForVosk(win: BrowserWindow | null): void {
  prompterWindow = win;
}

function sendWord(word: string): void {
  if (prompterWindow && !prompterWindow.isDestroyed()) {
    prompterWindow.webContents.send('vosk:on-word', word);
  }
}

function sendStatus(status: 'idle' | 'loading' | 'ready' | 'listening' | 'error', message?: string): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send('vosk:on-status', { status, message });
    }
  });
}

export async function startVosk(): Promise<void> {
  if (isListening) return;
  sendStatus('loading');
  // TODO: load Vosk model from bundled path, start mic stream, pipe to recognizer
  // For now we emulate "ready" and "listening" so UI works; no actual words.
  sendStatus('ready');
  isListening = true;
  sendStatus('listening');
}

export function stopVosk(): void {
  if (!isListening) return;
  isListening = false;
  sendStatus('idle');
}

export function isVoskListening(): boolean {
  return isListening;
}
