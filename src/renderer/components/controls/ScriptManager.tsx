import { useState } from 'react';
import { useScriptStore, defaultScriptSettings } from '../../store/scriptStore';
import { usePrompterStore } from '../../store/prompterStore';
import { useIpc } from '../../hooks/useIpc';
import { useEditorContext } from '../../contexts/EditorContext';
import type { Script } from '@shared/types';

export default function ScriptManager() {
  const [list, setList] = useState<Script[]>([]);
  const [showList, setShowList] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [showSave, setShowSave] = useState(false);
  const { editorContentJson, settings, setEditorContentJson, setSettings, setCurrentScript } = useScriptStore();
  const { baseWpm, setBaseWpm } = usePrompterStore();
  const ipc = useIpc();
  const editor = useEditorContext();

  const refreshList = async () => {
    if (!ipc) return;
    const scripts = await ipc.script.list();
    setList(scripts);
  };

  const openList = () => {
    setShowList(true);
    refreshList();
  };

  const handleSave = async () => {
    if (!ipc || !saveTitle.trim()) return;
    await ipc.script.create({
      title: saveTitle.trim(),
      body: editorContentJson,
      speech_speed: baseWpm,
      settings,
    });
    setSaveTitle('');
    setShowSave(false);
  };

  const handleLoad = async (script: Script) => {
    if (!ipc || !editor) return;
    const full = await ipc.script.read(script.id);
    if (!full) return;
    const parsedSettings = { ...defaultScriptSettings, ...JSON.parse(full.settings) } as typeof settings;
    setEditorContentJson(full.body);
    setSettings(parsedSettings);
    setBaseWpm(full.speech_speed);
    setCurrentScript(full);
    editor.commands.setContent(JSON.parse(full.body), false);
    ipc?.sendEditorContent(full.body);
    ipc?.window.resizePrompter(parsedSettings.prompterWidth, parsedSettings.prompterHeight);
    setShowList(false);
  };

  const handleDuplicate = async (script: Script) => {
    if (!ipc) return;
    const full = await ipc.script.read(script.id);
    if (!full) return;
    await ipc.script.create({
      title: `${full.title} (copy)`,
      body: full.body,
      speech_speed: full.speech_speed,
      settings: JSON.parse(full.settings),
    });
    refreshList();
  };

  const handleDelete = async (id: number) => {
    if (!ipc) return;
    await ipc.script.delete(id);
    refreshList();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setShowSave(true)}
        className="px-4 py-2 rounded bg-zinc-600 text-white text-sm font-medium hover:bg-zinc-500"
      >
        Save script
      </button>
      <button
        type="button"
        onClick={openList}
        className="px-4 py-2 rounded bg-zinc-600 text-white text-sm font-medium hover:bg-zinc-500"
      >
        Load / Manage
      </button>

      {showSave && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-600 min-w-[280px]">
            <h3 className="text-sm font-medium mb-2">Save script</h3>
            <input
              type="text"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="Script title"
              className="w-full bg-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm border border-zinc-600 mb-3"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowSave(false); setSaveTitle(''); }}
                className="px-3 py-1.5 rounded bg-zinc-600 text-sm hover:bg-zinc-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!saveTitle.trim()}
                className="px-3 py-1.5 rounded bg-emerald-600 text-sm hover:bg-emerald-500 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showList && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-600 max-w-md w-full max-h-[80vh] overflow-auto">
            <h3 className="text-sm font-medium mb-3">Saved scripts</h3>
            <ul className="space-y-2">
              {list.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 py-2 border-b border-zinc-700">
                  <span className="text-sm truncate flex-1">{s.title}</span>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleLoad(s)}
                      className="px-2 py-1 rounded bg-zinc-600 text-xs hover:bg-zinc-500"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(s)}
                      className="px-2 py-1 rounded bg-zinc-600 text-xs hover:bg-zinc-500"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id)}
                      className="px-2 py-1 rounded bg-red-900/60 text-xs hover:bg-red-800/60"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {list.length === 0 && <p className="text-zinc-500 text-sm py-4">No saved scripts.</p>}
            <button
              type="button"
              onClick={() => setShowList(false)}
              className="mt-3 w-full py-2 rounded bg-zinc-600 text-sm hover:bg-zinc-500"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
