import { BrowserWindow, screen, app } from "electron";
import path from "path";
import {
    DEFAULT_PROMPTER_HEIGHT,
    DEFAULT_PROMPTER_WIDTH,
    NOTCH_SAFE_Y,
} from "../../shared/constants";

const isDev = !app.isPackaged;

let prompterWindow: BrowserWindow | null = null;

export function getPrompterWindow(): BrowserWindow | null {
    return prompterWindow;
}

export function createPrompterWindow(
    width: number = DEFAULT_PROMPTER_WIDTH,
    height: number = DEFAULT_PROMPTER_HEIGHT,
): BrowserWindow {
    // ...
    // (code unchanged until isDev usage)
    if (prompterWindow && !prompterWindow.isDestroyed()) {
        prompterWindow.setSize(width, height);
        return prompterWindow;
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    // Use full display bounds (not workAreaSize) so window can overlap the menu bar / notch area
    const { width: screenWidth } = primaryDisplay.bounds;
    const x = Math.floor((screenWidth - width) / 2);
    const y = NOTCH_SAFE_Y;

    prompterWindow = new BrowserWindow({
        x,
        y,
        width,
        height,
        frame: false,
        transparent: false,
        backgroundColor: "#000000",
        resizable: false,
        movable: false,
        focusable: false,
        skipTaskbar: true,
        hasShadow: false,
        type: "panel", // CRITICAL for overlay on macOS
        enableLargerThanScreen: true,
        fullscreenable: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
        show: false,
    });

    // 'screen-saver' level ensures the window renders ABOVE the macOS menu / status bar
    prompterWindow.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true,
    });
    prompterWindow.setAlwaysOnTop(true, "screen-saver", 1);

    if (isDev) {
        prompterWindow.loadURL(`http://localhost:5173/?window=prompter`);
    } else {
        prompterWindow.loadURL(
            `file://${path.join(__dirname, "renderer/index.html")}?window=prompter`,
        );
    }

    prompterWindow.once("ready-to-show", () => prompterWindow?.show());

    prompterWindow.on("closed", () => {
        prompterWindow = null;
    });

    return prompterWindow;
}

export function resizePrompterWindow(width: number, height: number): void {
    if (!prompterWindow || prompterWindow.isDestroyed()) return;
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth } = primaryDisplay.bounds;
    const x = Math.floor((screenWidth - width) / 2);
    const y = NOTCH_SAFE_Y;
    prompterWindow.setBounds({ x, y, width, height });
}

export function showPrompterWindow(show: boolean): void {
    if (!prompterWindow || prompterWindow.isDestroyed()) return;
    if (show) {
        prompterWindow.show();
    } else {
        prompterWindow.hide();
    }
}
