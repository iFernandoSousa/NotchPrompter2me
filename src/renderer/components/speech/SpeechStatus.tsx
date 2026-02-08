import { useState, useEffect, useRef } from 'react';
import { useIpc } from '../../hooks/useIpc';
import type { VoskStatus } from '@shared/types';

const statusLabels: Record<VoskStatus, string> = {
  idle: 'Speech off',
  loading: 'Loading…',
  ready: 'Ready',
  listening: 'Listening',
  error: 'Error',
};

const BASE_SIZE_PX = 16;
const MAX_SIZE_PX = 48;
const MIN_SCALE = 1;
const MAX_SCALE = MAX_SIZE_PX / BASE_SIZE_PX;

export default function SpeechStatus() {
  const [status, setStatus] = useState<VoskStatus>('idle');
  const [message, setMessage] = useState<string | undefined>();
  const [amplitude, setAmplitude] = useState(0);
  const amplitudeRef = useRef(0);
  const ipc = useIpc();

  useEffect(() => {
    if (!ipc) return;
    const unsub = ipc.vosk.onStatus((payload) => {
      setStatus(payload.status);
      setMessage(payload.message);
      if (payload.status !== 'listening') setAmplitude(0);
    });
    return unsub;
  }, [ipc]);

  useEffect(() => {
    if (!ipc) return;
    const unsub = ipc.vosk.onAmplitude((payload) => {
      amplitudeRef.current = payload.amplitude;
      setAmplitude(payload.amplitude);
    });
    return unsub;
  }, [ipc]);

  const isListening = status === 'listening';
  const scale = isListening
    ? MIN_SCALE + amplitude * (MAX_SCALE - MIN_SCALE)
    : MIN_SCALE;
  const glowSize = isListening ? 4 + amplitude * 12 : 0;

  return (
    <div className="flex items-center gap-2 text-sm text-zinc-400">
      <span
        className="rounded-full bg-blue-500 flex-shrink-0 transition-all duration-150 ease-out"
        style={{
          width: BASE_SIZE_PX,
          height: BASE_SIZE_PX,
          transform: `scale(${scale})`,
          boxShadow: glowSize > 0 ? `0 0 ${glowSize}px rgba(59, 130, 246, 0.5)` : undefined,
        }}
        title={message}
      />
      <span className="flex flex-col">
        {statusLabels[status]}
        {status === 'error' && message && (
          <span className="text-xs text-red-400 max-w-[200px] truncate" title={message}>
            {message}
          </span>
        )}
      </span>
    </div>
  );
}
