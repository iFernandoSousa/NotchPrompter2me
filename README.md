# NotchPrompter

macOS teleprompter that shows your script in a window below the notch. Built with Electron, React, and TypeScript.

## Run as desktop app

```bash
npm install
npm start
```

**You should see two Electron windows** (no browser):

1. **NotchPrompter** – main controller (editor, playback, settings, scripts).
2. A small **prompter** window at the top-center of the screen (below the notch).

Do **not** open `http://localhost:5173` in Chrome or Safari; that URL is only used inside the app. If a browser tab opens by itself, you can close it and use only the Electron windows.

## Package a standalone app

To build an app you can run without the dev server:

```bash
npm run package
```

The built app will be in the `out/` directory. On macOS you can run the `.app` bundle from there.

## Script

See [spec/spec.md](spec/spec.md) for the full technical specification.
