import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants';
import {
  getPrompterWindow,
  resizePrompterWindow,
  showPrompterWindow,
} from '../windows/prompter';

export function registerWindowIpc(): void {
  ipcMain.on(IPC_CHANNELS.editorContentUpdate, (_event, content: string) => {
    const prompter = getPrompterWindow();
    if (prompter && !prompter.isDestroyed()) {
      prompter.webContents.send(IPC_CHANNELS.editorContentUpdate, content);
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.windowResizePrompter,
    (_event, width: number, height: number) => {
      resizePrompterWindow(width, height);
    }
  );

  ipcMain.handle(IPC_CHANNELS.windowShowPrompter, (_event, show: boolean) => {
    showPrompterWindow(show);
  });
}

export function getPrompterWindowForContent(): ReturnType<typeof getPrompterWindow> {
  return getPrompterWindow();
}
