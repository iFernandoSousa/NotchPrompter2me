/**
 * Native Vosk bindings using koffi (modern FFI) instead of the broken ffi-napi.
 * Loads libvosk.dylib/.so/.dll directly and exposes a high-level API compatible
 * with the original vosk npm package interface used in vosk-bridge.ts.
 */

import path from 'path';
import os from 'os';
import { app } from 'electron';

let koffi: typeof import('koffi');
let lib: ReturnType<typeof koffi.load> | null = null;

// C function signatures (will be populated after loading)
let fn_set_log_level: ((level: number) => void) | null = null;
let fn_model_new: ((path: string) => unknown) | null = null;
let fn_model_free: ((model: unknown) => void) | null = null;
let fn_recognizer_new: ((model: unknown, sampleRate: number) => unknown) | null = null;
let fn_recognizer_free: ((recognizer: unknown) => void) | null = null;
let fn_recognizer_accept_waveform: ((recognizer: unknown, data: Buffer, length: number) => number) | null = null;
let fn_recognizer_result: ((recognizer: unknown) => string) | null = null;
let fn_recognizer_partial_result: ((recognizer: unknown) => string) | null = null;
let fn_recognizer_final_result: ((recognizer: unknown) => string) | null = null;

function getLibraryPath(): string {
  const platform = os.platform();
  const nativeDir = app.isPackaged
    ? path.join(process.resourcesPath, 'native', 'vosk')
    : path.join(app.getAppPath(), 'native', 'vosk');

  if (platform === 'darwin') {
    return path.join(nativeDir, 'libvosk.dylib');
  } else if (platform === 'win32') {
    return path.join(nativeDir, 'libvosk.dll');
  } else {
    return path.join(nativeDir, 'libvosk.so');
  }
}

let loaded = false;

function ensureLoaded(): void {
  if (loaded) return;

  try {
    koffi = require('koffi');
  } catch (err) {
    throw new Error(`Failed to load koffi FFI module: ${err}`);
  }

  const libPath = getLibraryPath();
  console.log('[VoskNative] Loading libvosk from', libPath);

  try {
    lib = koffi.load(libPath);
  } catch (err) {
    throw new Error(`Failed to load libvosk native library from ${libPath}: ${err}`);
  }

  // Opaque pointer types
  const VoskModel = koffi.opaque('VoskModel');
  const VoskRecognizer = koffi.opaque('VoskRecognizer');
  const VoskModelPtr = koffi.pointer(VoskModel);
  const VoskRecognizerPtr = koffi.pointer(VoskRecognizer);

  // Bind C functions
  fn_set_log_level = lib.func('void vosk_set_log_level(int level)');
  fn_model_new = lib.func('VoskModel* vosk_model_new(const char* model_path)');
  fn_model_free = lib.func('void vosk_model_free(VoskModel* model)');
  fn_recognizer_new = lib.func('VoskRecognizer* vosk_recognizer_new(VoskModel* model, float sample_rate)');
  fn_recognizer_free = lib.func('void vosk_recognizer_free(VoskRecognizer* recognizer)');
  fn_recognizer_accept_waveform = lib.func('int vosk_recognizer_accept_waveform(VoskRecognizer* recognizer, const char* data, int length)');
  fn_recognizer_result = lib.func('const char* vosk_recognizer_result(VoskRecognizer* recognizer)');
  fn_recognizer_partial_result = lib.func('const char* vosk_recognizer_partial_result(VoskRecognizer* recognizer)');
  fn_recognizer_final_result = lib.func('const char* vosk_recognizer_final_result(VoskRecognizer* recognizer)');

  loaded = true;
  console.log('[VoskNative] libvosk loaded successfully');
}

/* ── Public API (mirrors the subset used by vosk-bridge.ts) ── */

export function setLogLevel(level: number): void {
  ensureLoaded();
  fn_set_log_level!(level);
}

export class Model {
  private handle: unknown;

  constructor(modelPath: string) {
    ensureLoaded();
    this.handle = fn_model_new!(modelPath);
    if (!this.handle) {
      throw new Error(`Failed to create Vosk model from ${modelPath}`);
    }
  }

  /** Internal: get the opaque pointer for use with Recognizer */
  _getHandle(): unknown {
    return this.handle;
  }

  free(): void {
    if (this.handle) {
      fn_model_free!(this.handle);
      this.handle = null;
    }
  }
}

export class Recognizer {
  private handle: unknown;

  constructor(params: { model: Model; sampleRate: number }) {
    ensureLoaded();
    this.handle = fn_recognizer_new!(params.model._getHandle(), params.sampleRate);
    if (!this.handle) {
      throw new Error('Failed to create Vosk recognizer');
    }
  }

  /**
   * Accept voice data (PCM 16-bit mono).
   * Returns true when a full utterance boundary is detected.
   */
  acceptWaveform(data: Buffer): boolean {
    if (!this.handle) return false;
    return fn_recognizer_accept_waveform!(this.handle, data, data.length) !== 0;
  }

  /** Returns JSON string of the recognition result. */
  result(): string {
    if (!this.handle) return '{"text":""}';
    return fn_recognizer_result!(this.handle);
  }

  /** Returns JSON string of the partial (in-progress) result. */
  partialResult(): string {
    if (!this.handle) return '{"partial":""}';
    return fn_recognizer_partial_result!(this.handle);
  }

  /** Returns JSON string of the final result (flushes pipeline). */
  finalResult(): string {
    if (!this.handle) return '{"text":""}';
    return fn_recognizer_final_result!(this.handle);
  }

  free(): void {
    if (this.handle) {
      fn_recognizer_free!(this.handle);
      this.handle = null;
    }
  }
}
