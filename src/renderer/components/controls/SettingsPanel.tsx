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

  const applyDimensions = (width: number, height: number) => {
    setSettings({ prompterWidth: width, prompterHeight: height });
    ipc?.window.resizePrompter(width, height);
  };

  return (
    <div className="flex flex-wrap items-end gap-4 p-3 rounded-lg bg-zinc-800 border border-zinc-700">
      <span className="text-sm font-medium text-zinc-300 w-full">Settings</span>
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
