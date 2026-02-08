import { ipcMain } from 'electron';
import type { ScriptCreatePayload, ScriptUpdatePayload } from '../../shared/types';
import { IPC_CHANNELS } from '../../shared/constants';
import * as scriptsRepo from '../db/scripts.repo';

export function registerScriptIpc(): void {
  ipcMain.handle(IPC_CHANNELS.scriptCreate, (_event, payload: ScriptCreatePayload) => {
    return scriptsRepo.createScript(payload);
  });

  ipcMain.handle(IPC_CHANNELS.scriptRead, (_event, id: number) => {
    return scriptsRepo.readScript(id);
  });

  ipcMain.handle(IPC_CHANNELS.scriptList, () => {
    return scriptsRepo.listScripts();
  });

  ipcMain.handle(IPC_CHANNELS.scriptUpdate, (_event, payload: ScriptUpdatePayload) => {
    return scriptsRepo.updateScript(payload);
  });

  ipcMain.handle(IPC_CHANNELS.scriptDelete, (_event, id: number) => {
    return scriptsRepo.deleteScript(id);
  });
}
