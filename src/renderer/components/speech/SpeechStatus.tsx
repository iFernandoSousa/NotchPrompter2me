import { useState, useEffect } from 'react';
import { useIpc } from '../../hooks/useIpc';
import type { VoskStatus } from '@shared/types';

const statusLabels: Record<VoskStatus, string> = {
  idle: 'Speech off',
  loading: 'Loading…',
  ready: 'Ready',
  listening: 'Listening',
  error: 'Error',
};

export default function SpeechStatus() {
  const [status, setStatus] = useState<VoskStatus>('idle');
  const [message, setMessage] = useState<string | undefined>();
  const ipc = useIpc();

  useEffect(() => {
    if (!ipc) return;
    const unsub = ipc.vosk.onStatus((payload) => {
      setStatus(payload.status);
      setMessage(payload.message);
    });
    return unsub;
  }, [ipc]);

  return (
    <div className="flex items-center gap-2 text-sm text-zinc-400" title={message}>
      <span className={`w-2 h-2 rounded-full ${
        status === 'listening' ? 'bg-emerald-500 animate-pulse' :
        status === 'ready' ? 'bg-emerald-500' :
        status === 'error' ? 'bg-red-500' : 'bg-zinc-500'
      }`} />
      {statusLabels[status]}
    </div>
  );
}
