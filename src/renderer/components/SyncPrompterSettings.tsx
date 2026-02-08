import { useEffect } from 'react';
import { useScriptStore } from '../store/scriptStore';
import { useIpc } from '../hooks/useIpc';

/** Syncs controller settings to the prompter window via IPC so font/size/color apply there. */
export default function SyncPrompterSettings() {
  const settings = useScriptStore((s) => s.settings);
  const ipc = useIpc();

  useEffect(() => {
    ipc?.sendPrompterSettings(settings);
  }, [ipc, settings]);

  return null;
}
