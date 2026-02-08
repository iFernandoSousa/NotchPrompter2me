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
  voskCheckModel: 'vosk:check-model',
  voskDownloadModel: 'vosk:download-model',
  voskOnDownloadProgress: 'vosk:on-download-progress',
  voskOnAmplitude: 'vosk:on-amplitude',
  windowResizePrompter: 'window:resize-prompter',
  windowShowPrompter: 'window:show-prompter',
  editorContentUpdate: 'editor:content-update',
  prompterSettingsUpdate: 'prompter:settings-update',
} as const;

/** Default words per minute for base scroll speed. */
export const DEFAULT_WPM = 150;

/** Y offset for prompter window: 0 = glued to top edge (below menu bar). */
export const NOTCH_SAFE_Y = 0;

/** Default prompter window dimensions (px). */
export const DEFAULT_PROMPTER_WIDTH = 650;
export const DEFAULT_PROMPTER_HEIGHT = 140;

/** Default font settings. */
export const DEFAULT_FONT_FAMILY = 'system-ui';
export const DEFAULT_FONT_SIZE = 24;
export const DEFAULT_FONT_COLOR = '#ffffff';

/** Controller window dimensions. */
export const CONTROLLER_WIDTH = 900;
export const CONTROLLER_HEIGHT = 700;

/** Vosk speech recognition languages (small models for desktop). */
export interface VoskLanguageOption {
  code: string;
  label: string;
  model: string;
  size: string;
  url: string;
}

export const VOSK_LANGUAGES: readonly VoskLanguageOption[] = [
  { code: 'en-us', label: 'English (US)', model: 'vosk-model-small-en-us-0.15', size: '40M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip' },
  { code: 'en-in', label: 'English (Indian)', model: 'vosk-model-small-en-in-0.4', size: '36M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-en-in-0.4.zip' },
  { code: 'cn', label: 'Chinese', model: 'vosk-model-small-cn-0.22', size: '42M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-cn-0.22.zip' },
  { code: 'ru', label: 'Russian', model: 'vosk-model-small-ru-0.22', size: '45M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-ru-0.22.zip' },
  { code: 'fr', label: 'French', model: 'vosk-model-small-fr-0.22', size: '41M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-fr-0.22.zip' },
  { code: 'de', label: 'German', model: 'vosk-model-small-de-0.15', size: '45M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-de-0.15.zip' },
  { code: 'es', label: 'Spanish', model: 'vosk-model-small-es-0.42', size: '39M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-es-0.42.zip' },
  { code: 'pt', label: 'Portuguese', model: 'vosk-model-small-pt-0.3', size: '31M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-pt-0.3.zip' },
  { code: 'tr', label: 'Turkish', model: 'vosk-model-small-tr-0.3', size: '35M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-tr-0.3.zip' },
  { code: 'vn', label: 'Vietnamese', model: 'vosk-model-small-vn-0.4', size: '32M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-vn-0.4.zip' },
  { code: 'it', label: 'Italian', model: 'vosk-model-small-it-0.22', size: '48M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-it-0.22.zip' },
  { code: 'nl', label: 'Dutch', model: 'vosk-model-small-nl-0.22', size: '39M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-nl-0.22.zip' },
  { code: 'ca', label: 'Catalan', model: 'vosk-model-small-ca-0.4', size: '42M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-ca-0.4.zip' },
  { code: 'fa', label: 'Farsi (Persian)', model: 'vosk-model-small-fa-0.42', size: '53M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-fa-0.42.zip' },
  { code: 'uk', label: 'Ukrainian', model: 'vosk-model-small-uk-v3-nano', size: '73M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-uk-v3-nano.zip' },
  { code: 'kz', label: 'Kazakh', model: 'vosk-model-small-kz-0.42', size: '58M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-kz-0.42.zip' },
  { code: 'ja', label: 'Japanese', model: 'vosk-model-small-ja-0.22', size: '48M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-ja-0.22.zip' },
  { code: 'eo', label: 'Esperanto', model: 'vosk-model-small-eo-0.42', size: '42M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-eo-0.42.zip' },
  { code: 'hi', label: 'Hindi', model: 'vosk-model-small-hi-0.22', size: '42M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-hi-0.22.zip' },
  { code: 'cs', label: 'Czech', model: 'vosk-model-small-cs-0.4-rhasspy', size: '44M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-cs-0.4-rhasspy.zip' },
  { code: 'pl', label: 'Polish', model: 'vosk-model-small-pl-0.22', size: '50M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-pl-0.22.zip' },
  { code: 'uz', label: 'Uzbek', model: 'vosk-model-small-uz-0.22', size: '49M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-uz-0.22.zip' },
  { code: 'ko', label: 'Korean', model: 'vosk-model-small-ko-0.22', size: '82M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-ko-0.22.zip' },
  { code: 'gu', label: 'Gujarati', model: 'vosk-model-small-gu-0.42', size: '100M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-gu-0.42.zip' },
  { code: 'tg', label: 'Tajik', model: 'vosk-model-small-tg-0.22', size: '50M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-tg-0.22.zip' },
  { code: 'te', label: 'Telugu', model: 'vosk-model-small-te-0.42', size: '58M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-te-0.42.zip' },
  { code: 'ky', label: 'Kyrgyz', model: 'vosk-model-small-ky-0.42', size: '49M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-ky-0.42.zip' },
];

export const DEFAULT_LANGUAGE = 'en-us';
