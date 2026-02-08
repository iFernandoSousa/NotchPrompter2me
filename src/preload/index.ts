import { contextBridge, ipcRenderer } from 'electron';
import type { Script, ScriptCreatePayload, ScriptUpdatePayload, VoskStatusPayload, NotchPrompterAPI } from '../shared/types';
import { IPC_CHANNELS } from '../shared/constants';

const api: NotchPrompterAPI = {
  script: {
    create: (payload) => ipcRenderer.invoke(IPC_CHANNELS.scriptCreate, payload),
    read: (id) => ipcRenderer.invoke(IPC_CHANNELS.scriptRead, id),
    list: () => ipcRenderer.invoke(IPC_CHANNELS.scriptList),
    update: (payload) => ipcRenderer.invoke(IPC_CHANNELS.scriptUpdate, payload),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.scriptDelete, id),
  },
  vosk: {
    start: () => ipcRenderer.invoke(IPC_CHANNELS.voskStart),
    stop: () => { ipcRenderer.invoke(IPC_CHANNELS.voskStop); },
    onWord: (callback) => {
      const handler = (_: unknown, word: string) => callback(word);
      ipcRenderer.on(IPC_CHANNELS.voskOnWord, handler);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.voskOnWord, handler);
    },
    onStatus: (callback) => {
      const handler = (_: unknown, payload: VoskStatusPayload) => callback(payload);
      ipcRenderer.on(IPC_CHANNELS.voskOnStatus, handler);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.voskOnStatus, handler);
    },
  },
  window: {
    resizePrompter: (width, height) =>
      ipcRenderer.invoke(IPC_CHANNELS.windowResizePrompter, width, height),
    showPrompter: (show) => ipcRenderer.invoke(IPC_CHANNELS.windowShowPrompter, show),
  },
  sendEditorContent: (content: string) => {
    ipcRenderer.send(IPC_CHANNELS.editorContentUpdate, content);
  },
  onEditorContentUpdate: (callback) => {
    const handler = (_: unknown, content: string) => callback(content);
    ipcRenderer.on(IPC_CHANNELS.editorContentUpdate, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.editorContentUpdate, handler);
  },
};

contextBridge.exposeInMainWorld('notchPrompter', api);
