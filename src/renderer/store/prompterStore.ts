import { create } from 'zustand';

export type PlaybackState = 'stopped' | 'playing' | 'paused';

interface PrompterState {
  playbackState: PlaybackState;
  scrollPosition: number;
  baseWpm: number;
  setPlaybackState: (state: PlaybackState) => void;
  setScrollPosition: (position: number) => void;
  setBaseWpm: (wpm: number) => void;
}

export const usePrompterStore = create<PrompterState>((set) => ({
  playbackState: 'stopped',
  scrollPosition: 0,
  baseWpm: 150,
  setPlaybackState: (playbackState) => set({ playbackState }),
  setScrollPosition: (scrollPosition) => set({ scrollPosition }),
  setBaseWpm: (baseWpm) => set({ baseWpm }),
}));
