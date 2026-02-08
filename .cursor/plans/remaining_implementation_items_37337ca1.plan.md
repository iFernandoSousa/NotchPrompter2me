---
name: Remaining Implementation Items
overview: The project scaffolding, UI components, IPC wiring, database, editor, prompter view, settings, and script management are all built. The major remaining work is Vosk integration, language selection with on-demand model download, black prompter styling, and an audio-reactive voice indicator.
todos:
  - id: install-verify
    content: Run npm install, resolve any native module build issues (better-sqlite3), and verify the app launches with npm start
    status: completed
  - id: black-prompter
    content: Change the prompter window and PrompterView background to solid black (#000) so it blends with the MacBook notch bezel
    status: completed
  - id: language-selection
    content: Add a language field to ScriptSettings and constants, create a VOSK_LANGUAGES registry with model URLs/sizes, add a Language dropdown to SettingsPanel, persist selection per script
    status: completed
  - id: model-download
    content: Build an on-demand model download system in main process -- download, extract, cache Vosk models to app data dir, expose IPC for download progress, show UI status in controller
    status: completed
  - id: vosk-integration
    content: Add vosk and audio capture packages, implement real speech recognition in vosk-bridge.ts using the downloaded model for the selected language
    status: completed
  - id: mic-permissions
    content: Add macOS microphone permission request using Electron systemPreferences API before starting Vosk
    status: completed
  - id: voice-indicator
    content: Replace the SpeechStatus dot with an audio-reactive blue circle that pulses/expands based on mic input amplitude, forwarded from main via IPC
    status: completed
  - id: elastic-sync-tuning
    content: Improve word matching (wider window, fuzzy matching), DOM-based scroll targeting, and speed interpolation in useElasticSync.ts
    status: completed
  - id: polish-edge-cases
    content: Handle error states (model missing, mic denied), consider worker thread for Vosk, verify base WPM fallback end-to-end
    status: completed
isProject: false
---

# Remaining Implementation for NotchPrompter

## Status Summary

The existing plan marks all tasks as "completed", but several items are stubs or incomplete. Below is the full gap analysis, now including four new requirements from the user.

---

## Fully Implemented (no work needed)

- Electron dual-window system (controller + frameless prompter)
- Prompter window positioning (top-center, y=44, always-on-top, transparent)
- TipTap rich text editor with Bold/Italic/Underline/Strike
- Editor-to-Prompter content sync via IPC
- SQLite database with script CRUD (create, read, list, update, delete)
- Script Manager UI (save with title, load, duplicate, delete)
- Settings panel (font family, size, color, WPM, prompter dimensions)
- Playback controls (Play/Pause/Stop)
- Zustand stores (prompter state, script state)
- Preload script with typed API
- All IPC channel handlers wired up
- Project config (Forge, Vite, Tailwind, TypeScript)

---

## NEW Requirements

### N1. Black Teleprompter Background (blend with notch)

The prompter must use a **solid black background** (`#000000`) to visually blend with the MacBook notch bezel, as shown in the reference image. Currently the prompter window is `transparent: true` with `bg-transparent` in `PrompterWindow.tsx`.

**Files to change:**

- [src/renderer/windows/PrompterWindow.tsx](src/renderer/windows/PrompterWindow.tsx) -- change `bg-transparent` to `bg-black`
- [src/renderer/components/prompter/PrompterView.tsx](src/renderer/components/prompter/PrompterView.tsx) -- ensure the scroll container also has a black background
- [src/main/windows/prompter.ts](src/main/windows/prompter.ts) -- keep `transparent: true` on the BrowserWindow so corners can be rounded, but set the renderer `<body>` background to black. Alternatively, set `transparent: false` and use `backgroundColor: '#000000'` for a true opaque black window matching the bezel.

The text color defaults to `#ffffff` (white) already, which gives the correct look from the reference image.

### N2. Language Selection Dropdown (Vosk languages)

Add a **Language** dropdown to the Settings panel and persist it per script in `ScriptSettings`. The dropdown lists all languages supported by Vosk (small models recommended for desktop use).

**Language registry** -- define in [src/shared/constants.ts](src/shared/constants.ts):

```typescript
export const VOSK_LANGUAGES = [
  { code: 'en-us',  label: 'English (US)',         model: 'vosk-model-small-en-us-0.15',      size: '40M',  url: 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip' },
  { code: 'en-in',  label: 'English (Indian)',     model: 'vosk-model-small-en-in-0.4',       size: '36M',  url: 'https://alphacephei.com/vosk/models/vosk-model-small-en-in-0.4.zip' },
  { code: 'cn',     label: 'Chinese',              model: 'vosk-model-small-cn-0.22',         size: '42M',  url: 'https://alphacephei.com/vosk/models/vosk-model-small-cn-0.22.zip' },
  { code: 'ru',     label: 'Russian',              model: 'vosk-model-small-ru-0.22',         size: '45M',  url: 'https://alphacephei.com/vosk/models/vosk-model-small-ru-0.22.zip' },
  { code: 'fr',     label: 'French',               model: 'vosk-model-small-fr-0.22',         size: '41M',  url: 'https://alphacephei.com/vosk/models/vosk-model-small-fr-0.22.zip' },
  { code: 'de',     label: 'German',               model: 'vosk-model-small-de-0.15',         size: '45M',  url: 'https://alphacephei.com/vosk/models/vosk-model-small-de-0.15.zip' },
  { code: 'es',     label: 'Spanish',              model: 'vosk-model-small-es-0.42',         size: '39M',  url: 'https://alphacephei.com/vosk/models/vosk-model-small-es-0.42.zip' },
  { code: 'pt',     label: 'Portuguese',           model: 'vosk-model-small-pt-0.3',          size: '31M',  url: 'https://alphacephei.com/vosk/models/vosk-model-small-pt-0.3.zip' },
  { code: 'tr',     label: 'Turkish',              model: 'vosk-model-small-tr-0.3',          size: '35M',  url: 'https://alphacephei.com/vosk/models/vosk-model-small-tr-0.3.zip' },
  { code: 'vn',     label: 'Vietnamese',           model: 'vosk-model-small-vn-0.4',          size: '32M',  url: 'https://alphacephei.com/vosk/models/vosk-model-small-vn-0.4.zip' },
  { code: 'it',     label: 'Italian',              model: 'vosk-model-small-it-0.22',         size: '48M',  url: 'https://alphacephei.com/vosk/models/vosk-model-small-it-0.22.zip' },
  { code: 'nl',     label: 'Dutch',                model: 'vosk-model-small-nl-0.22',         size: '39M',  url: 'https://alphacephei.com/vosk/models/vosk-model-small-nl-0.22.zip' },
  { code: 'ca',     label: 'Catalan',              model: 'vosk-model-small-ca-0.4',          size: '42M',  url: 'https://alphacephei.com/vosk/models/vosk-model-small-ca-0.4.zip' },
  { code: 'fa',     label: 'Farsi (Persian)',      model: 'vosk-model-small-fa-0.42',         size: '53M',  url: 'https://alphacephei.com/vosk/models/vosk-model-small-fa-0.42.zip' },
  { code: 'uk',     label: 'Ukrainian',            model: 'vosk-model-small-uk-v3-nano',      size: '73M',  url: 'https://alphacephei.com/vosk/models/vosk-model-small-uk-v3-nano.zip' },
  { code: 'kz',     label: 'Kazakh',               model: 'vosk-model-small-kz-0.42',         size: '58M',  url: 'https://alphacephei.com/vosk/models/vosk-model-small-kz-0.42.zip' },
  { code: 'ja',     label: 'Japanese',             model: 'vosk-model-small-ja-0.22',         size: '48M',  url: 'https://alphacephei.com/vosk/models/vosk-model-small-ja-0.22.zip' },
  { code: 'eo',     label: 'Esperanto',            model: 'vosk-model-small-eo-0.42',         size: '42M',  url: 'https://alphacephei.com/vosk/models/vosk-model-small-eo-0.42.zip' },
  { code: 'hi',     label: 'Hindi',                model: 'vosk-model-small-hi-0.22',         size: '42M',  url: 'https://alphacephei.com/vosk/models/vosk-model-small-hi-0.22.zip' },
  { code: 'cs',     label: 'Czech',                model: 'vosk-model-small-cs-0.4-rhasspy',  size: '44M',  url: 'https://alphacephei.com/vosk/models/vosk-model-small-cs-0.4-rhasspy.zip' },
  { code: 'pl',     label: 'Polish',               model: 'vosk-model-small-pl-0.22',         size: '50M',  url: 'https://alphacephei.com/vosk/models/vosk-model-small-pl-0.22.zip' },
  { code: 'uz',     label: 'Uzbek',                model: 'vosk-model-small-uz-0.22',         size: '49M',  url: 'https://alphacephei.com/vosk/models/vosk-model-small-uz-0.22.zip' },
  { code: 'ko',     label: 'Korean',               model: 'vosk-model-small-ko-0.22',         size: '82M',  url: 'https://alphacephei.com/vosk/models/vosk-model-small-ko-0.22.zip' },
  { code: 'gu',     label: 'Gujarati',             model: 'vosk-model-small-gu-0.42',         size: '100M', url: 'https://alphacephei.com/vosk/models/vosk-model-small-gu-0.42.zip' },
  { code: 'tg',     label: 'Tajik',                model: 'vosk-model-small-tg-0.22',         size: '50M',  url: 'https://alphacephei.com/vosk/models/vosk-model-small-tg-0.22.zip' },
  { code: 'te',     label: 'Telugu',               model: 'vosk-model-small-te-0.42',         size: '58M',  url: 'https://alphacephei.com/vosk/models/vosk-model-small-te-0.42.zip' },
  { code: 'ky',     label: 'Kyrgyz',               model: 'vosk-model-small-ky-0.42',         size: '49M',  url: 'https://alphacephei.com/vosk/models/vosk-model-small-ky-0.42.zip' },
] as const;

export const DEFAULT_LANGUAGE = 'en-us';
```

**Type changes** in [src/shared/types.ts](src/shared/types.ts):

- Add `language: string` to `ScriptSettings` (defaults to `'en-us'`)

**UI changes** in [src/renderer/components/controls/SettingsPanel.tsx](src/renderer/components/controls/SettingsPanel.tsx):

- Add a `<select>` dropdown populated from `VOSK_LANGUAGES`
- Show model size next to each option (e.g. "English (US) - 40M")
- Show a download badge/icon if the model for the selected language is not yet cached locally
- On language change, update `settings.language` via `setSettings()`

**IPC extension**:

- Add `vosk:model-status` channel so renderer can query which models are already downloaded
- `vosk:start` should accept a `language` parameter so the bridge loads the correct model

### N3. On-Demand Model Download

Models are NOT bundled with the app. Instead, they are downloaded when the user first selects a language (or when they press Play with a language whose model is missing).

**New file** -- `src/main/vosk/model-manager.ts`:

- `getModelDir(languageCode)` -- returns path under `app.getPath('userData')/vosk-models/<model-name>/`
- `isModelDownloaded(languageCode)` -- checks if the model directory exists and contains expected files
- `downloadModel(languageCode, onProgress)` -- downloads the `.zip` from the URL in `VOSK_LANGUAGES`, extracts to the model directory, reports progress via callback
- `deleteModel(languageCode)` -- removes a cached model to free space

**IPC channels** to add:

- `vosk:check-model` (renderer -> main) -- returns `{ downloaded: boolean, size: string }` for a given language
- `vosk:download-model` (renderer -> main) -- triggers download, streams progress events back
- `vosk:on-download-progress` (main -> renderer) -- `{ language, percent, bytesDownloaded, totalBytes }`

**UI** -- when the user selects a language that is not downloaded:

- Show a "Download Model (40M)" button or auto-prompt
- Display a progress bar during download
- Once complete, update status to "Ready"
- If download fails, show error with retry option

**Vosk bridge** -- `startVosk(language)` reads the language, resolves the model path via `getModelDir()`, and loads it. If model is missing, sends `error` status with message "Model not downloaded".

### N4. Audio-Reactive Voice Indicator (Blue Pulsing Circle)

Replace the current simple dot in [src/renderer/components/speech/SpeechStatus.tsx](src/renderer/components/speech/SpeechStatus.tsx) with an animated blue circle that grows/shrinks based on the microphone input amplitude.

**Audio amplitude from main process**:

- In the Vosk bridge (or a parallel audio analyzer), compute the RMS amplitude of each audio chunk from the mic stream
- Normalize to 0.0-1.0 range
- Send via new IPC channel `vosk:on-amplitude` at ~15-30fps (throttled)

**IPC additions**:

- Add `vosk:on-amplitude` channel (main -> renderer), payload: `{ amplitude: number }` (0.0 to 1.0)
- Expose in preload as `vosk.onAmplitude(callback)`

**Renderer component** -- redesign `SpeechStatus.tsx`:

- When status is `listening`, render a blue circle (`bg-blue-500`) that scales based on amplitude
- Use CSS `transform: scale(baseScale + amplitude * maxScale)` with a smooth `transition` for organic feel
- Base size ~16px, max expansion ~40-48px at full amplitude
- Add a subtle glow/shadow effect (e.g. `box-shadow: 0 0 Npx rgba(59,130,246,0.5)`) that also scales with amplitude
- When not listening, show a static small blue circle (idle state)
- The circle should be positioned in the controller window header area where `SpeechStatus` currently sits

---

## Previously Identified Gaps (still applicable)

### 5. Vosk Speech Recognition -- core integration

The file [src/main/vosk/vosk-bridge.ts](src/main/vosk/vosk-bridge.ts) is a **stub**. It only toggles status strings and never captures audio or recognizes words.

What needs to happen:

- **Install Vosk dependency** -- `vosk` is not in `package.json`. A Node.js Vosk binding (e.g. `vosk` npm package) needs to be added.
- **Install an audio capture package** -- e.g. `node-record-lpcm16` or `mic` for capturing microphone PCM audio.
- **Implement `startVosk(language)**`: load model from cached dir (via model-manager), open mic stream, pipe audio chunks into the Vosk recognizer, parse partial/final results, call `sendWord()` with each recognized word, compute amplitude and send via `vosk:on-amplitude`.
- **Implement `stopVosk()**`: tear down mic stream and recognizer cleanly.
- **Error handling**: handle model-not-found, mic permission denied, recognizer failures.

### 6. Microphone Permissions (macOS)

- Use Electron's `systemPreferences.askForMediaAccess('microphone')` before starting the mic stream.
- Show a user-facing explanation in the UI if permission is denied.
- Not implemented anywhere currently.

### 7. Elastic Sync Refinement

The hook at [src/renderer/hooks/useElasticSync.ts](src/renderer/hooks/useElasticSync.ts) needs tuning once Vosk is working:

- `getTargetScrollY()` should map word indices to actual DOM positions
- Word matching window (currently 5) should be wider with fuzzy matching
- Speed interpolation needs real-world testing and tuning
- Base WPM fallback should be verified end-to-end

### 8. App Build and Run Verification

- Run `npm install`, ensure `better-sqlite3` native compilation works
- Verify app starts with `npm start`
- Fix any runtime wiring errors

---

## Priority Order

1. **Install dependencies and verify the app starts** -- foundational
2. **Black prompter background** -- quick visual fix, matches the reference image
3. **Language selection + types** -- add the language field and UI dropdown
4. **On-demand model download** -- model-manager + download UI
5. **Vosk integration** -- real speech recognition using downloaded models
6. **Microphone permissions** -- required before Vosk can capture audio
7. **Voice indicator** -- audio-reactive blue circle (depends on Vosk sending amplitude data)
8. **Elastic sync tuning** -- refine once Vosk provides real word events
9. **Polish** -- error states, performance, edge cases

