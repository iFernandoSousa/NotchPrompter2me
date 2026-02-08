import { EditorProvider } from '../contexts/EditorContext';
import ScriptEditor from '../components/editor/ScriptEditor';
import EditorToolbar from '../components/editor/EditorToolbar';
import PlaybackControls from '../components/controls/PlaybackControls';
import SettingsPanel from '../components/controls/SettingsPanel';
import ScriptManager from '../components/controls/ScriptManager';
import SpeechStatus from '../components/speech/SpeechStatus';

export default function ControllerWindow() {
  return (
    <EditorProvider>
      <div className="min-h-screen bg-zinc-900 text-zinc-100 flex flex-col">
        <header className="border-b border-zinc-700 px-4 py-2 flex items-center justify-between">
          <h1 className="text-lg font-semibold">NotchPrompter</h1>
          <SpeechStatus />
        </header>
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 flex flex-col min-w-0 p-4">
            <div className="flex gap-2 mb-2">
              <EditorToolbar />
            </div>
            <div className="flex-1 border border-zinc-700 rounded-lg overflow-hidden bg-zinc-800">
              <ScriptEditor />
            </div>
            <div className="mt-4 flex gap-4 flex-wrap">
              <PlaybackControls />
              <SettingsPanel />
              <ScriptManager />
            </div>
          </main>
        </div>
      </div>
    </EditorProvider>
  );
}
