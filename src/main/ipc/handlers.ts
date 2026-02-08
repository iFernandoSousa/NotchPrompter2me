import { getPrompterWindow } from '../windows/prompter';
import { setPrompterWindowForVosk } from '../vosk/vosk-bridge';
import { registerScriptIpc } from './script.ipc';
import { registerVoskIpc } from './vosk.ipc';
import { registerWindowIpc } from './window.ipc';

export function registerIpcHandlers(): void {
  registerScriptIpc();
  registerVoskIpc();
  registerWindowIpc();

  const prompter = getPrompterWindow();
  if (prompter) {
    setPrompterWindowForVosk(prompter);
  }
}
