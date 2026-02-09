/**
 * Shared types for NotchPrompter (main, preload, renderer).
 */

/** User settings stored per script (JSON in DB). */
export interface ScriptSettings {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  prompterWidth: number;
  prompterHeight: number;
  /** Vosk language code (e.g. 'en-us'). */
  language: string;
}

/** Script entity as stored in SQLite. */
export interface Script {
  id: number;
  title: string;
  body: string;
  speech_speed: number;
  settings: string;
  created_at: string;
  updated_at: string;
}

/** Script with settings parsed from JSON. */
export interface ScriptWithSettings extends Omit<Script, 'settings'> {
  settings: ScriptSettings;
}

/** Row returned from script:list (same as Script). */
export type ScriptListItem = Script;

/** TipTap document (JSON). */
export type EditorContent = object;

/** Payload for script:create / script:update. */
export interface ScriptCreatePayload {
  title: string;
  body: string;
  speech_speed: number;
  settings: ScriptSettings;
}

/** Payload for script:update (includes id). */
export interface ScriptUpdatePayload extends ScriptCreatePayload {
  id: number;
}

/** Vosk status sent to renderer. */
export type VoskStatus = 'idle' | 'loading' | 'ready' | 'listening' | 'error';

/** Payload for vosk:on-status. */
export interface VoskStatusPayload {
  status: VoskStatus;
  message?: string;
}

/** Payload for vosk:on-download-progress. */
export interface VoskDownloadProgressPayload {
  language: string;
  percent: number;
  bytesDownloaded: number;
  totalBytes: number;
}

/** Payload for vosk:on-amplitude (0.0–1.0). */
export interface VoskAmplitudePayload {
  amplitude: number;
}

/** API exposed to renderer via contextBridge (preload). */
export interface NotchPrompterAPI {
  script: {
    create: (payload: ScriptCreatePayload) => Promise<Script>;
    read: (id: number) => Promise<Script | null>;
    list: () => Promise<Script[]>;
    update: (payload: ScriptUpdatePayload) => Promise<Script | null>;
    delete: (id: number) => Promise<boolean>;
  };
  vosk: {
    start: (language: string) => Promise<void>;
    stop: () => void;
    onWord: (callback: (word: string) => void) => () => void;
    onStatus: (callback: (payload: VoskStatusPayload) => void) => () => void;
    checkModel: (languageCode: string) => Promise<{ downloaded: boolean; size: string }>;
    downloadModel: (languageCode: string) => Promise<void>;
    onDownloadProgress: (callback: (payload: VoskDownloadProgressPayload) => void) => () => void;
    onAmplitude: (callback: (payload: VoskAmplitudePayload) => void) => () => void;
  };
  window: {
    resizePrompter: (width: number, height: number) => Promise<void>;
    showPrompter: (show: boolean) => Promise<void>;
  };
  sendEditorContent: (content: string) => void;
  onEditorContentUpdate: (callback: (content: string) => void) => () => void;
  sendPrompterSettings: (settings: ScriptSettings) => void;
  onPrompterSettingsUpdate: (callback: (settings: ScriptSettings) => void) => () => void;
  sendPlaybackState: (state: string) => void;
  onPlaybackStateUpdate: (callback: (state: string) => void) => () => void;
  sendAudioData: (pcm16Buffer: ArrayBuffer) => void;
}
