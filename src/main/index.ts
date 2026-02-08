import { app, BrowserWindow, Menu } from "electron";
import fs from "fs";
import path from "path";
import { registerIpcHandlers } from "./ipc/handlers";
import { createControllerWindow } from "./windows/controller";
import { createPrompterWindow } from "./windows/prompter";
import { initDatabase } from "./db/database";

let controllerWindow: BrowserWindow | null = null;

function createApplicationMenu() {
    const isMac = process.platform === "darwin";

    const template: Electron.MenuItemConstructorOptions[] = [
        // { role: 'appMenu' }
        ...((isMac
            ? [
                  {
                      label: app.name,
                      submenu: [
                          { role: "about" },
                          { type: "separator" },
                          { role: "services" },
                          { type: "separator" },
                          { role: "hide" },
                          { role: "hideOthers" },
                          { role: "unhide" },
                          { type: "separator" },
                          { role: "quit" },
                      ],
                  },
              ]
            : []) as Electron.MenuItemConstructorOptions[]),
        // { role: 'fileMenu' }
        {
            label: "File",
            submenu: [isMac ? { role: "close" } : { role: "quit" }],
        } as Electron.MenuItemConstructorOptions,
        // { role: 'editMenu' }
        {
            label: "Edit",
            submenu: [
                { role: "undo" },
                { role: "redo" },
                { type: "separator" },
                { role: "cut" },
                { role: "copy" },
                { role: "paste" },
                { role: "delete" },
                { role: "selectAll" },
            ],
        } as Electron.MenuItemConstructorOptions,
        // { role: 'viewMenu' }
        {
            label: "View",
            submenu: [
                { role: "reload" },
                { role: "forceReload" },
                { role: "toggleDevTools" },
                { type: "separator" },
                { role: "resetZoom" },
                { role: "zoomIn" },
                { role: "zoomOut" },
                { type: "separator" },
                { role: "togglefullscreen" },
            ],
        } as Electron.MenuItemConstructorOptions,
        // { role: 'windowMenu' }
        {
            label: "Window",
            submenu: [
                { role: "minimize" },
                { role: "zoom" },
                ...(isMac
                    ? [
                          { type: "separator" },
                          { role: "front" },
                          { type: "separator" },
                          { role: "window" },
                      ]
                    : [{ role: "close" }]),
            ],
        } as Electron.MenuItemConstructorOptions,
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function setAppIconIfExists(): void {
    if (process.platform !== "darwin") return;
    const cwdPath = path.join(process.cwd(), "assets", "icon.png");
    const appPath = path.join(app.getAppPath(), "assets", "icon.png");
    const p = fs.existsSync(cwdPath)
        ? cwdPath
        : fs.existsSync(appPath)
          ? appPath
          : null;
    if (p) {
        try {
            app.dock.setIcon(p);
        } catch {
            // ignore
        }
    }
}

async function init() {
    try {
        initDatabase();
        if (process.platform === "darwin") {
            app.dock.show();
        }
        setAppIconIfExists();
        app.setName("Notch Prompter");
        createApplicationMenu();
        controllerWindow = createControllerWindow();
        createPrompterWindow();
        registerIpcHandlers();
    } catch (error) {
        console.error("Error during init:", error);
    }
}

process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
});

app.whenReady().then(init);

app.on("window-all-closed", () => {
    // On macOS keep app in dock when all windows are closed (quit with Cmd+Q or Dock)
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        init();
    } else {
        controllerWindow?.show();
    }
});
