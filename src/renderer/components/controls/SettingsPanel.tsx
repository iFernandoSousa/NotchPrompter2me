import { useState, useEffect, useCallback, useMemo } from 'react';
import { useScriptStore } from '../../store/scriptStore';
import { usePrompterStore } from '../../store/prompterStore';
import { useEditorContext } from '../../contexts/EditorContext';
import { useIpc } from '../../hooks/useIpc';
import { useMicCaptureContext } from '../../contexts/MicCaptureContext';
import ScriptManager from './ScriptManager';
import {
  DEFAULT_FONT_SIZE,
  DEFAULT_PROMPTER_WIDTH,
  DEFAULT_PROMPTER_HEIGHT,
  DEFAULT_WPM,
  VOSK_LANGUAGES,
} from '@shared/constants';

const FONT_OPTIONS = [
  { value: "'SF Pro Display', -apple-system, system-ui, sans-serif", label: 'SF Pro Display' },
  { value: 'system-ui', label: 'System' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: "'Times New Roman', Times, serif", label: 'Times New Roman' },
  { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
  { value: 'Inter, sans-serif', label: 'Inter' },
];

/* ── Helpers ── */

function formatWordCount(count: number): string {
  if (count >= 1000) {
    const k = count / 1000;
    return k >= 10 ? `${Math.round(k)}k` : `${k.toFixed(1)}k`;
  }
  return count.toString();
}

function formatDuration(minutes: number): string {
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/* ── Sub-components ── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-semibold tracking-[0.15em] uppercase text-zinc-500 mb-3">
      {children}
    </h3>
  );
}

function SettingLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium text-zinc-400">{children}</span>;
}

function SliderSetting({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <SettingLabel>{label}</SettingLabel>
        <span className="text-xs font-semibold text-blue-400 tabular-nums">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

/* ── Notch Preview ── */

function NotchPreview({ fontColor, fontFamily }: { fontColor: string; fontFamily: string }) {
  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-full max-w-[240px]">
        {/* Notch bump */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[88px] h-[18px] bg-black rounded-b-xl z-10" />

        {/* Display area */}
        <div className="bg-[#0d0e11] rounded-2xl w-full h-[60px] flex items-end justify-center pb-2.5 border border-white/[0.04]">
          <span
            className="text-[11px] opacity-80 truncate px-4"
            style={{ color: fontColor, fontFamily: fontFamily }}
          >
            Seu texto aparecerá aqui…
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Main SettingsPanel ── */

export default function SettingsPanel() {
  const { settings, setSettings, editorContentJson } = useScriptStore();
  const { baseWpm, setBaseWpm } = usePrompterStore();
  const editor = useEditorContext();
  const ipc = useIpc();
  const mic = useMicCaptureContext();
  const [modelDownloaded, setModelDownloaded] = useState<boolean>(true);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  /* ── Restore last language from localStorage ── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('notchprompter:language');
      if (saved && VOSK_LANGUAGES.some((l) => l.code === saved)) {
        setSettings({ language: saved });
      }
    } catch { /* noop */ }
  }, []);

  /* ── Persist language selection ── */
  const handleLanguageChange = (lang: string) => {
    setSettings({ language: lang });
    try { localStorage.setItem('notchprompter:language', lang); } catch { /* noop */ }
  };

  /* ── Word count & duration ── */
  const wordCount = useMemo(() => {
    if (!editor) return 0;
    const text = editor.getText();
    return text.split(/\s+/).filter(Boolean).length;
  }, [editor, editorContentJson]);

  const durationMinutes = useMemo(
    () => (wordCount > 0 ? Math.ceil(wordCount / baseWpm) : 0),
    [wordCount, baseWpm],
  );

  /* ── Vosk model status ── */
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
      await refreshModelStatus();
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed');
      setDownloadProgress(null);
    }
  };

  const applyDimensions = (width: number, height: number) => {
    setSettings({ prompterWidth: width, prompterHeight: height });
    ipc?.window.resizePrompter(width, height);
  };

  /* ── Find current language label & size ── */
  const currentLang = VOSK_LANGUAGES.find((l) => l.code === settings.language);

  return (
    <div className="flex flex-col h-full">
      {/* ── Notch Preview section ── */}
      <div className="px-4 pt-5 pb-4">
        <SectionTitle>Preview do Notch</SectionTitle>
        <NotchPreview fontColor={settings.fontColor} fontFamily={settings.fontFamily} />

        {/* Stats row */}
        <div className="flex items-center justify-center gap-8 mt-4">
          <div className="text-center">
            <div className="text-lg font-bold text-zinc-100 tabular-nums">
              {formatWordCount(wordCount)}
            </div>
            <div className="text-[9px] tracking-[0.12em] uppercase text-zinc-500 font-medium">
              Palavras
            </div>
          </div>
          <div className="w-px h-8 bg-white/[0.06]" />
          <div className="text-center">
            <div className="text-lg font-bold text-zinc-100 tabular-nums">
              {formatDuration(durationMinutes)}
            </div>
            <div className="text-[9px] tracking-[0.12em] uppercase text-zinc-500 font-medium">
              Duração
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06] mx-4" />

      {/* ── Configuration section ── */}
      <div className="px-4 pt-4 pb-2 flex-1 overflow-y-auto space-y-4">
        <SectionTitle>Configurações</SectionTitle>

        {/* Language */}
        <div className="space-y-1.5">
          <SettingLabel>Idioma</SettingLabel>
          <div className="flex items-center gap-2">
            <select
              value={settings.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="flex-1 bg-[#1c1d22] text-zinc-200 rounded-lg px-3 py-2 text-sm border border-white/[0.06] focus:border-blue-500/40 focus:outline-none transition-colors"
            >
              {VOSK_LANGUAGES.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="text-[10px] font-medium text-zinc-500 bg-white/[0.04] px-2 py-1 rounded-md flex-shrink-0">
              {currentLang?.size ?? ''}
            </span>
          </div>

          {/* Model download UI */}
          {!modelDownloaded && downloadProgress === null && (
            <div className="flex items-center gap-2 mt-1.5">
              <button
                type="button"
                onClick={handleDownloadModel}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition-colors"
              >
                Download modelo
              </button>
              <span className="text-[10px] text-zinc-600">(opcional)</span>
            </div>
          )}
          {downloadProgress !== null && (
            <div className="mt-1.5 space-y-1">
              <div className="h-1.5 w-full bg-[#1c1d22] rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(downloadProgress, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-500">
                {downloadProgress < 100 ? `${downloadProgress}%` : 'Pronto'}
              </span>
            </div>
          )}
          {downloadError && (
            <span className="text-[10px] text-red-400 block mt-1">{downloadError}</span>
          )}
        </div>

        {/* Microphone device */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <SettingLabel>Microfone</SettingLabel>
            <button
              type="button"
              onClick={() => mic?.refreshDevices()}
              className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
            >
              Refresh
            </button>
          </div>
          <select
            value={mic?.selectedDeviceId ?? ''}
            onChange={(e) => mic?.setSelectedDeviceId(e.target.value)}
            className="w-full bg-[#1c1d22] text-zinc-200 rounded-lg px-3 py-2 text-sm border border-white/[0.06] focus:border-blue-500/40 focus:outline-none transition-colors"
          >
            {(!mic?.devices.length) && (
              <option value="">No devices found</option>
            )}
            {mic?.devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
          {mic?.isCapturing && (
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Capturing audio
            </span>
          )}
        </div>

        {/* Font */}
        <div className="space-y-1.5">
          <SettingLabel>Fonte</SettingLabel>
          <select
            value={settings.fontFamily}
            onChange={(e) => setSettings({ fontFamily: e.target.value })}
            className="w-full bg-[#1c1d22] text-zinc-200 rounded-lg px-3 py-2 text-sm border border-white/[0.06] focus:border-blue-500/40 focus:outline-none transition-colors"
          >
            {FONT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Text color */}
        <div className="space-y-1.5">
          <SettingLabel>Cor do Texto</SettingLabel>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={settings.fontColor}
              onChange={(e) => setSettings({ fontColor: e.target.value })}
              className="w-9 h-9 rounded-lg border border-white/[0.08] bg-[#1c1d22] cursor-pointer"
            />
            <span className="text-sm text-zinc-300 font-mono tracking-wider uppercase">
              {settings.fontColor}
            </span>
          </div>
        </div>

        {/* WPM slider */}
        <SliderSetting
          label="Velocidade (WPM)"
          value={baseWpm}
          min={60}
          max={300}
          onChange={(v) => setBaseWpm(v)}
        />

        {/* Width slider */}
        <SliderSetting
          label="Largura"
          value={settings.prompterWidth}
          min={260}
          max={2000}
          step={2}
          unit="px"
          onChange={(v) => {
            setSettings({ prompterWidth: v });
            applyDimensions(v, settings.prompterHeight);
          }}
        />

        {/* Height slider */}
        <SliderSetting
          label="Altura"
          value={settings.prompterHeight}
          min={112}
          max={400}
          step={2}
          unit="px"
          onChange={(v) => {
            setSettings({ prompterHeight: v });
            applyDimensions(settings.prompterWidth, v);
          }}
        />
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06] mx-4" />

      {/* ── Script management ── */}
      <div className="px-4 py-4 flex-shrink-0">
        <ScriptManager />
      </div>
    </div>
  );
}
