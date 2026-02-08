import { BrowserWindow } from 'electron';
import path from 'path';
import { CONTROLLER_HEIGHT, CONTROLLER_WIDTH } from '../../shared/constants';

const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

export function createControllerWindow(): BrowserWindow {
  const win = new BrowserWindow({
    title: 'NotchPrompter',
    width: CONTROLLER_WIDTH,
    height: CONTROLLER_HEIGHT,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  if (isDev) {
    win.loadURL(`http://localhost:5173/?window=controller`);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadURL(
      `file://${path.join(__dirname, 'renderer/index.html')}?window=controller`
    );
  }

  win.once('ready-to-show', () => {
    win.show();
    win.focus();
  });

  return win;
}
