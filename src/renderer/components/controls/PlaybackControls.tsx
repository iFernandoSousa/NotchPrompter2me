import { usePrompterStore } from '../../store/prompterStore';
import { useScriptStore } from '../../store/scriptStore';
import { useIpc } from '../../hooks/useIpc';

export default function PlaybackControls() {
  const { playbackState, setPlaybackState } = usePrompterStore();
  const { settings } = useScriptStore();
  const ipc = useIpc();

  const handlePlay = () => {
    setPlaybackState('playing');
    ipc?.sendPrompterSettings(settings);
    ipc?.window.showPrompter(true);
    ipc?.vosk.start(settings.language);
  };

  const handlePause = () => {
    setPlaybackState('paused');
    ipc?.vosk.stop();
  };

  const handleStop = () => {
    setPlaybackState('stopped');
    ipc?.vosk.stop();
    ipc?.window.showPrompter(false);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-400">Playback</span>
      <button
        type="button"
        onClick={handlePlay}
        disabled={playbackState === 'playing'}
        className="px-4 py-2 rounded bg-emerald-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500"
      >
        Play
      </button>
      <button
        type="button"
        onClick={handlePause}
        disabled={playbackState !== 'playing'}
        className="px-4 py-2 rounded bg-amber-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-500"
      >
        Pause
      </button>
      <button
        type="button"
        onClick={handleStop}
        className="px-4 py-2 rounded bg-zinc-600 text-white text-sm font-medium hover:bg-zinc-500"
      >
        Stop
      </button>
    </div>
  );
}
