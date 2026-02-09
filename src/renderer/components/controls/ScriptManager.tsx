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
    <div className="space-y-2">
      {/* Save button */}
      <button
        type="button"
        onClick={() => setShowSave(true)}
        className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 active:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
        Salvar Roteiro
      </button>

      {/* Manage button */}
      <button
        type="button"
        onClick={openList}
        className="w-full py-2 rounded-xl text-sm text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors flex items-center justify-center gap-2"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        Gerenciar Roteiros
      </button>

      {/* ── Save modal ── */}
      {showSave && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1c1d22] rounded-2xl p-5 border border-white/[0.06] min-w-[320px] shadow-2xl animate-fade-in">
            <h3 className="text-sm font-semibold text-zinc-200 mb-3">Salvar roteiro</h3>
            <input
              type="text"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="Título do roteiro"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="w-full bg-[#111215] text-zinc-200 rounded-xl px-4 py-2.5 text-sm border border-white/[0.06] focus:border-blue-500/40 focus:outline-none mb-4 placeholder-zinc-600 transition-colors"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowSave(false); setSaveTitle(''); }}
                className="px-4 py-2 rounded-lg bg-white/[0.04] text-sm text-zinc-400 hover:bg-white/[0.08] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!saveTitle.trim()}
                className="px-4 py-2 rounded-lg bg-blue-600 text-sm text-white font-medium hover:bg-blue-500 disabled:opacity-40 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manage modal ── */}
      {showList && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1c1d22] rounded-2xl p-5 border border-white/[0.06] max-w-md w-full max-h-[80vh] overflow-auto shadow-2xl animate-fade-in">
            <h3 className="text-sm font-semibold text-zinc-200 mb-4">Roteiros salvos</h3>
            <ul className="space-y-1">
              {list.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-2 py-2.5 px-3 rounded-xl hover:bg-white/[0.03] transition-colors group"
                >
                  <span className="text-sm text-zinc-300 truncate flex-1">{s.title}</span>
                  <div className="flex gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleLoad(s)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-400 text-xs font-medium hover:bg-blue-600/30 transition-colors"
                    >
                      Abrir
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(s)}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.04] text-zinc-400 text-xs hover:bg-white/[0.08] transition-colors"
                    >
                      Copiar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id)}
                      className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {list.length === 0 && (
              <p className="text-zinc-600 text-sm py-8 text-center">Nenhum roteiro salvo.</p>
            )}
            <button
              type="button"
              onClick={() => setShowList(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-white/[0.04] text-sm text-zinc-400 hover:bg-white/[0.08] transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
