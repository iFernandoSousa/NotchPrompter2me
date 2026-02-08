import { useState, useEffect, useCallback } from 'react';
import { useScriptStore } from '../../store/scriptStore';
import { usePrompterStore } from '../../store/prompterStore';
import { useIpc } from '../../hooks/useIpc';
import {
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_FONT_COLOR,
  DEFAULT_PROMPTER_WIDTH,
  DEFAULT_PROMPTER_HEIGHT,
  DEFAULT_WPM,
  VOSK_LANGUAGES,
} from '@shared/constants';

const FONT_OPTIONS = [
  { value: 'system-ui', label: 'System' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Inter', label: 'Inter' },
];

export default function SettingsPanel() {
  const { settings, setSettings } = useScriptStore();
  const { baseWpm, setBaseWpm } = usePrompterStore();
  const ipc = useIpc();
  const [modelDownloaded, setModelDownloaded] = useState<boolean>(true);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const refreshModelStatus = useCallback(async () => {
    if (!ipc) return;
    const { downloaded } = await ipc.vosk.checkModel(settings.language);
    setModelDownloaded(downloaded);
  }, [ipc, settings.language]);

  useEffect(() => {
    refreshModelStatus();
  }, [refreshModelStatus]);

  useEffect(() => {
    if (!ipc) return;
    const unsub = ipc.vosk.onDownloadProgress((p) => {
      setDownloadProgress(p.percent);
      if (p.percent >= 100) {
        setModelDownloaded(true);
        setDownloadProgress(null);
        setDownloadError(null);
      }
    });
    return unsub;
  }, [ipc]);

  const handleDownloadModel = async () => {
    if (!ipc) return;
    setDownloadError(null);
    setDownloadProgress(0);
    try {
      await ipc.vosk.downloadModel(settings.language);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed');
      setDownloadProgress(null);
    }
  };

  const applyDimensions = (width: number, height: number) => {
    setSettings({ prompterWidth: width, prompterHeight: height });
    ipc?.window.resizePrompter(width, height);
  };

  return (
    <div className="flex flex-wrap items-end gap-4 p-3 rounded-lg bg-zinc-800 border border-zinc-700">
      <span className="text-sm font-medium text-zinc-300 w-full">Settings</span>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500">Language</span>
        <div className="flex items-center gap-2">
          <select
            value={settings.language}
            onChange={(e) => setSettings({ language: e.target.value })}
            className="bg-zinc-700 text-zinc-100 rounded px-2 py-1.5 text-sm border border-zinc-600 min-w-[180px]"
          >
            {VOSK_LANGUAGES.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label} ({opt.size})
              </option>
            ))}
          </select>
          {!modelDownloaded && downloadProgress === null && (
            <button
              type="button"
              onClick={handleDownloadModel}
              className="px-2 py-1.5 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-500"
            >
              Download model
            </button>
          )}
          {downloadProgress !== null && (
            <span className="text-xs text-zinc-400">
              {downloadProgress < 100 ? `${downloadProgress}%` : 'Ready'}
            </span>
          )}
        </div>
        {downloadProgress !== null && downloadProgress < 100 && (
          <div className="h-1.5 w-full bg-zinc-700 rounded overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        )}
        {downloadError && (
          <span className="text-xs text-red-400">{downloadError}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500">Font</span>
        <select
          value={settings.fontFamily}
          onChange={(e) => setSettings({ fontFamily: e.target.value })}
          className="bg-zinc-700 text-zinc-100 rounded px-2 py-1.5 text-sm border border-zinc-600"
        >
          {FONT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500">Size</span>
        <input
          type="number"
          min={12}
          max={72}
          value={settings.fontSize}
          onChange={(e) => setSettings({ fontSize: Number(e.target.value) || DEFAULT_FONT_SIZE })}
          className="w-20 bg-zinc-700 text-zinc-100 rounded px-2 py-1.5 text-sm border border-zinc-600"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500">Color</span>
        <input
          type="color"
          value={settings.fontColor}
          onChange={(e) => setSettings({ fontColor: e.target.value })}
          className="w-10 h-9 rounded border border-zinc-600 bg-zinc-700 cursor-pointer"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500">WPM</span>
        <input
          type="number"
          min={60}
          max={300}
          value={baseWpm}
          onChange={(e) => setBaseWpm(Number(e.target.value) || DEFAULT_WPM)}
          className="w-20 bg-zinc-700 text-zinc-100 rounded px-2 py-1.5 text-sm border border-zinc-600"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500">Width</span>
        <input
          type="number"
          min={200}
          max={2000}
          value={settings.prompterWidth}
          onChange={(e) => {
            const w = Number(e.target.value) || DEFAULT_PROMPTER_WIDTH;
            setSettings({ prompterWidth: w });
            applyDimensions(w, settings.prompterHeight);
          }}
          className="w-24 bg-zinc-700 text-zinc-100 rounded px-2 py-1.5 text-sm border border-zinc-600"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500">Height</span>
        <input
          type="number"
          min={40}
          max={400}
          value={settings.prompterHeight}
          onChange={(e) => {
            const h = Number(e.target.value) || DEFAULT_PROMPTER_HEIGHT;
            setSettings({ prompterHeight: h });
            applyDimensions(settings.prompterWidth, h);
          }}
          className="w-24 bg-zinc-700 text-zinc-100 rounded px-2 py-1.5 text-sm border border-zinc-600"
        />
      </label>
    </div>
  );
}
