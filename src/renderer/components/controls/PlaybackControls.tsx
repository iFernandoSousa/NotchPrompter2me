import { usePrompterStore } from '../../store/prompterStore';
import { useScriptStore } from '../../store/scriptStore';
import { useIpc } from '../../hooks/useIpc';
import { useMicCaptureContext } from '../../contexts/MicCaptureContext';

export default function PlaybackControls() {
  const { playbackState, setPlaybackState } = usePrompterStore();
  const { settings } = useScriptStore();
  const ipc = useIpc();
  const mic = useMicCaptureContext();

  const handlePlay = async () => {
    setPlaybackState('playing');
    ipc?.sendPlaybackState('playing');
    ipc?.sendPrompterSettings(settings);
    ipc?.window.showPrompter(true);
    await ipc?.vosk.start(settings.language);
    // Start mic capture (audio flows from renderer → main process)
    if (mic && !mic.isCapturing) {
      await mic.startCapture();
    }
  };

  const handlePause = () => {
    setPlaybackState('paused');
    ipc?.sendPlaybackState('paused');
    ipc?.vosk.stop();
    mic?.stopCapture();
  };

  const handleStop = () => {
    setPlaybackState('stopped');
    ipc?.sendPlaybackState('stopped');
    ipc?.vosk.stop();
    mic?.stopCapture();
    ipc?.window.showPrompter(false);
  };

  const isPlaying = playbackState === 'playing';
  const isPaused = playbackState === 'paused';

  return (
    <div className="h-12 border-t border-white/[0.06] flex items-center justify-between px-5 flex-shrink-0 bg-[#111215]">
      {/* Left: Label + buttons */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500 select-none mr-1">
          Playback
        </span>

        {/* Play */}
        <button
          type="button"
          onClick={handlePlay}
          disabled={isPlaying}
          className={`
            flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
            ${
              isPlaying
                ? 'bg-emerald-600/20 text-emerald-400 cursor-default'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700'
            }
            disabled:opacity-60
          `}
        >
          <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
            <path d="M0 0l10 6-10 6z" />
          </svg>
          Play
        </button>

        {/* Pause */}
        <button
          type="button"
          onClick={handlePause}
          disabled={!isPlaying}
          className={`
            flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
            ${
              isPaused
                ? 'bg-amber-600/20 text-amber-400'
                : 'bg-zinc-700/60 text-zinc-300 hover:bg-zinc-600/60'
            }
            disabled:opacity-40 disabled:cursor-not-allowed
          `}
        >
          <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
            <rect x="0" y="0" width="3" height="12" rx="1" />
            <rect x="7" y="0" width="3" height="12" rx="1" />
          </svg>
          Pausar
        </button>

        {/* Stop */}
        <button
          type="button"
          onClick={handleStop}
          className={`
            flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
            ${
              playbackState === 'stopped'
                ? 'bg-zinc-800/60 text-zinc-500 cursor-default'
                : 'bg-red-600/80 text-white hover:bg-red-500/80 active:bg-red-700/80'
            }
          `}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <rect x="0" y="0" width="10" height="10" rx="1.5" />
          </svg>
          Parar
        </button>
      </div>

      {/* Right: Keyboard shortcuts */}
      <div className="flex items-center gap-2 select-none">
        <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-[10px] text-zinc-500 font-mono">
          ⌘
        </kbd>
        <span className="text-[10px] text-zinc-600">+</span>
        <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-[10px] text-zinc-500 font-mono">
          Space
        </kbd>
        <span className="text-[10px] text-zinc-600 ml-1">Play / Pause</span>
      </div>
    </div>
  );
}
