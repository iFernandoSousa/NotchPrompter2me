import { create } from 'zustand';
import type { Script, ScriptSettings } from '@shared/types';
import {
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_FONT_COLOR,
  DEFAULT_PROMPTER_WIDTH,
  DEFAULT_PROMPTER_HEIGHT,
  DEFAULT_LANGUAGE,
} from '@shared/constants';

interface ScriptState {
  currentScript: Script | null;
  editorContentJson: string;
  settings: ScriptSettings;
  setCurrentScript: (script: Script | null) => void;
  setEditorContentJson: (json: string) => void;
  setSettings: (settings: Partial<ScriptSettings>) => void;
}

export const defaultScriptSettings: ScriptSettings = {
  fontFamily: DEFAULT_FONT_FAMILY,
  fontSize: DEFAULT_FONT_SIZE,
  fontColor: DEFAULT_FONT_COLOR,
  prompterWidth: DEFAULT_PROMPTER_WIDTH,
  prompterHeight: DEFAULT_PROMPTER_HEIGHT,
  language: DEFAULT_LANGUAGE,
};

export const useScriptStore = create<ScriptState>((set) => ({
  currentScript: null,
  editorContentJson: JSON.stringify({
    type: 'doc',
    content: [{ type: 'paragraph', content: [] }],
  }),
  settings: defaultScriptSettings,
  setCurrentScript: (currentScript) => set({ currentScript }),
  setEditorContentJson: (editorContentJson) => set({ editorContentJson }),
  setSettings: (partial) =>
    set((state) => ({
      settings: { ...state.settings, ...partial },
    })),
}));
