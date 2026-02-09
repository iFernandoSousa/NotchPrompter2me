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

const statusColors: Record<VoskStatus, string> = {
  idle: 'bg-zinc-600',
  loading: 'bg-amber-500',
  ready: 'bg-emerald-500',
  listening: 'bg-blue-500',
  error: 'bg-red-500',
};

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
  const isActive = status !== 'idle';
  const dotScale = isListening ? 1 + amplitude * 0.6 : 1;

  return (
    <div className="flex items-center gap-2.5 text-xs select-none">
      {/* Status indicator dot */}
      <div className="relative flex items-center justify-center w-5 h-5">
        {/* Pulse ring when listening */}
        {isListening && (
          <span className="absolute inset-0 rounded-full bg-blue-500/30 animate-pulse-ring" />
        )}

        {/* Main dot */}
        <span
          className={`
            relative z-10 rounded-full transition-all duration-200 ease-out
            ${statusColors[status]}
            ${isListening ? 'w-3 h-3' : 'w-2 h-2'}
          `}
          style={{
            transform: `scale(${dotScale})`,
            boxShadow: isListening
              ? `0 0 ${6 + amplitude * 10}px rgba(59, 130, 246, 0.5)`
              : undefined,
          }}
        />
      </div>

      {/* Status text */}
      <span className={`text-xs font-medium ${isActive ? 'text-zinc-300' : 'text-zinc-500'}`}>
        {statusLabels[status]}
      </span>

      {/* Error message */}
      {status === 'error' && message && (
        <span className="text-[10px] text-red-400 max-w-[150px] truncate" title={message}>
          {message}
        </span>
      )}
    </div>
  );
}
