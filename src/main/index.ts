import { app, BrowserWindow } from 'electron';
import path from 'path';
import { registerIpcHandlers } from './ipc/handlers';
import { createControllerWindow } from './windows/controller';
import { createPrompterWindow } from './windows/prompter';
import { initDatabase } from './db/database';

let controllerWindow: BrowserWindow | null = null;

async function init() {
  initDatabase();
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
