import { app, BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import { registerIpcHandlers } from './ipc/handlers';
import { createControllerWindow } from './windows/controller';
import { createPrompterWindow } from './windows/prompter';
import { initDatabase } from './db/database';

let controllerWindow: BrowserWindow | null = null;

function setAppIconIfExists(): void {
  if (process.platform !== 'darwin') return;
  const cwdPath = path.join(process.cwd(), 'assets', 'icon.png');
  const appPath = path.join(app.getAppPath(), 'assets', 'icon.png');
  const p = fs.existsSync(cwdPath) ? cwdPath : fs.existsSync(appPath) ? appPath : null;
  if (p) {
    try {
      app.dock.setIcon(p);
    } catch {
      // ignore
    }
  }
}

async function init() {
  initDatabase();
  setAppIconIfExists();
  controllerWindow = createControllerWindow();
  createPrompterWindow();
  registerIpcHandlers();
}

app.whenReady().then(init);

app.on('window-all-closed', () => {
  // On macOS keep app in dock when all windows are closed (quit with Cmd+Q or Dock)
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    init();
  } else {
    controllerWindow?.show();
  }
});
