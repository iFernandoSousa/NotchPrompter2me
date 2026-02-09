import { EditorProvider } from '../contexts/EditorContext';
import { MicCaptureProvider } from '../contexts/MicCaptureContext';
import ScriptEditor from '../components/editor/ScriptEditor';
import EditorToolbar from '../components/editor/EditorToolbar';
import PlaybackControls from '../components/controls/PlaybackControls';
import SettingsPanel from '../components/controls/SettingsPanel';
import SpeechStatus from '../components/speech/SpeechStatus';
import SyncPrompterSettings from '../components/SyncPrompterSettings';

export default function ControllerWindow() {
  return (
    <EditorProvider>
    <MicCaptureProvider>
      <SyncPrompterSettings />
      <div className="h-screen bg-[#111215] text-zinc-100 flex flex-col overflow-hidden">
        {/* ── Header / Title bar ── */}
        <header className="drag-region h-12 border-b border-white/[0.06] flex items-center justify-between px-5 flex-shrink-0">
          {/* Left spacer for macOS traffic lights */}
          <div className="w-[70px] flex-shrink-0" />

          <h1 className="text-[13px] font-medium tracking-wider text-zinc-500 uppercase select-none">
            NotchPrompter
          </h1>

          <div className="no-drag flex-shrink-0">
            <SpeechStatus />
          </div>
        </header>

        {/* ── Main content: two columns ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left column: Editor */}
          <main className="flex-1 flex flex-col min-w-0">
            <EditorToolbar />
            <div className="flex-1 overflow-hidden">
              <ScriptEditor />
            </div>
          </main>

          {/* Right column: Settings sidebar */}
          <aside className="w-[290px] flex-shrink-0 border-l border-white/[0.06] overflow-y-auto bg-[#131416]">
            <SettingsPanel />
          </aside>
        </div>

        {/* ── Footer: Playback bar ── */}
        <PlaybackControls />
      </div>
    </MicCaptureProvider>
    </EditorProvider>
  );
}
