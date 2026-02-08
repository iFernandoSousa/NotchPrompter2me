import { create } from 'zustand';
import type { Script, ScriptSettings } from '@shared/types';
import {
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_FONT_COLOR,
  DEFAULT_PROMPTER_WIDTH,
  DEFAULT_PROMPTER_HEIGHT,
} from '@shared/constants';

interface ScriptState {
  currentScript: Script | null;
  editorContentJson: string;
  settings: ScriptSettings;
  setCurrentScript: (script: Script | null) => void;
  setEditorContentJson: (json: string) => void;
  setSettings: (settings: Partial<ScriptSettings>) => void;
}

const defaultSettings: ScriptSettings = {
  fontFamily: DEFAULT_FONT_FAMILY,
  fontSize: DEFAULT_FONT_SIZE,
  fontColor: DEFAULT_FONT_COLOR,
  prompterWidth: DEFAULT_PROMPTER_WIDTH,
  prompterHeight: DEFAULT_PROMPTER_HEIGHT,
};

export const useScriptStore = create<ScriptState>((set) => ({
  currentScript: null,
  editorContentJson: JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [] }],
  }),
  settings: defaultSettings,
  setCurrentScript: (currentScript) => set({ currentScript }),
  setEditorContentJson: (editorContentJson) => set({ editorContentJson }),
  setSettings: (partial) =>
    set((state) => ({
      settings: { ...state.settings, ...partial },
    })),
}));
