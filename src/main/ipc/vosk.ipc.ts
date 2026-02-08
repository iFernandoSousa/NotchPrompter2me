import { ipcMain, systemPreferences } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';
import * as voskBridge from '../vosk/vosk-bridge';
import * as modelManager from '../vosk/model-manager';

async function ensureMicrophoneAccess(): Promise<boolean> {
  if (process.platform !== 'darwin') return true;
  const status = systemPreferences.getMediaAccessStatus('microphone');
  if (status === 'granted') return true;
  if (status === 'denied') return false;
  return systemPreferences.askForMediaAccess('microphone');
}

export function registerVoskIpc(): void {
  ipcMain.handle(IPC_CHANNELS.voskStart, async (event, language: string) => {
    const modelAvailable = modelManager.isModelDownloaded(language);
    console.log(`[VoskIPC] start: lang=${language}, modelAvailable=${modelAvailable}`);

    // Only require mic permission when we actually have a model to use
    if (modelAvailable) {
      const allowed = await ensureMicrophoneAccess();
      if (!allowed) {
        console.log('[VoskIPC] Microphone access denied, falling back to WPM-only mode');
        // Still start in stub mode so WPM scrolling works
      }
    }

    await voskBridge.startVosk(language);
  });

  ipcMain.handle(IPC_CHANNELS.voskStop, () => {
    voskBridge.stopVosk();
  });

  ipcMain.handle(IPC_CHANNELS.voskCheckModel, async (_event, languageCode: string) => {
    const option = modelManager.getLanguageOption(languageCode);
    const downloaded = modelManager.isModelDownloaded(languageCode);
    console.log(`[VoskIPC] checkModel: lang=${languageCode}, downloaded=${downloaded}, size=${option?.size ?? '0M'}`);
    return {
      downloaded,
      size: option?.size ?? '0M',
    };
  });

  ipcMain.handle(IPC_CHANNELS.voskDownloadModel, async (event, languageCode: string) => {
    const sendProgress = (progress: modelManager.DownloadProgress) => {
      event.sender.send(IPC_CHANNELS.voskOnDownloadProgress, progress);
    };
    await modelManager.downloadModel(languageCode, sendProgress);
  });
}
