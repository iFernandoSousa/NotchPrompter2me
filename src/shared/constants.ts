/**
 * Shared constants for NotchPrompter.
 */

/** IPC channel names. */
export const IPC_CHANNELS = {
  scriptCreate: 'script:create',
  scriptRead: 'script:read',
  scriptList: 'script:list',
  scriptUpdate: 'script:update',
  scriptDelete: 'script:delete',
  voskStart: 'vosk:start',
  voskStop: 'vosk:stop',
  voskOnWord: 'vosk:on-word',
  voskOnStatus: 'vosk:on-status',
  windowResizePrompter: 'window:resize-prompter',
  windowShowPrompter: 'window:show-prompter',
  editorContentUpdate: 'editor:content-update',
} as const;

/** Default words per minute for base scroll speed. */
export const DEFAULT_WPM = 150;

/** Y offset for prompter window (below notch safe area on macOS). */
export const NOTCH_SAFE_Y = 44;

/** Default prompter window dimensions (px). */
export const DEFAULT_PROMPTER_WIDTH = 800;
export const DEFAULT_PROMPTER_HEIGHT = 80;

/** Default font settings. */
export const DEFAULT_FONT_FAMILY = 'system-ui';
export const DEFAULT_FONT_SIZE = 24;
export const DEFAULT_FONT_COLOR = '#ffffff';

/** Controller window dimensions. */
export const CONTROLLER_WIDTH = 900;
export const CONTROLLER_HEIGHT = 700;
