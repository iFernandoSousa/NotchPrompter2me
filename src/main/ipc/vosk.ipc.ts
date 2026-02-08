import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';
import * as voskBridge from '../vosk/vosk-bridge';

export function registerVoskIpc(): void {
  ipcMain.handle(IPC_CHANNELS.voskStart, async () => {
    await voskBridge.startVosk();
  });

  ipcMain.handle(IPC_CHANNELS.voskStop, () => {
    voskBridge.stopVosk();
  });
}
