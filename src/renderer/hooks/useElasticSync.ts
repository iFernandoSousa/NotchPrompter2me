import { useEffect, useRef, useCallback } from 'react';
import { usePrompterStore } from '../store/prompterStore';
import { useIpc } from './useIpc';

interface UseElasticSyncArgs {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  contentJson: string;
  enabled: boolean;
}

/** Extract ordered list of words from TipTap JSON. */
function getWordsFromJson(json: string): string[] {
  try {
    const doc = JSON.parse(json) as { content?: Array<{ content?: Array<{ text?: string }> }> };
    const words: string[] = [];
    doc.content?.forEach((block) => {
      block.content?.forEach((node) => {
        const t = node.text ?? '';
        t.split(/\s+/).forEach((w) => w.trim() && words.push(w.trim()));
      });
    });
    return words;
  } catch {
    return [];
  }
}

export function useElasticSync({ scrollRef, contentRef, contentJson, enabled }: UseElasticSyncArgs): void {
  const { baseWpm } = usePrompterStore();
  const ipc = useIpc();
  const currentWordIndexRef = useRef(0);
  const targetScrollYRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const wordsRef = useRef<string[]>([]);

  wordsRef.current = getWordsFromJson(contentJson);

  const onWord = useCallback((word: string) => {
    const words = wordsRef.current;
    const idx = currentWordIndexRef.current;
    const w = word.trim().toLowerCase();
    for (let i = idx; i < Math.min(idx + 5, words.length); i++) {
      if (words[i].toLowerCase() === w || words[i].toLowerCase().startsWith(w)) {
        currentWordIndexRef.current = i + 1;
        break;
      }
    }
  }, []);

  useEffect(() => {
    if (!ipc) return;
    const unsub = ipc.vosk.onWord(onWord);
    return unsub;
  }, [ipc, onWord]);

  useEffect(() => {
    if (enabled) currentWordIndexRef.current = 0;
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !scrollRef.current || !contentRef.current) return;
    const scrollEl = scrollRef.current;
    const contentEl = contentRef.current;
    const words = wordsRef.current;

    const getTargetScrollY = (): number => {
      if (words.length === 0) return 0;
      const idx = Math.min(currentWordIndexRef.current, words.length - 1);
      const wordIndex = idx;
      const child = contentEl.querySelector('p');
      if (!child) return 0;
      const lineHeight = child.offsetHeight * 1.2;
      return Math.max(0, wordIndex * lineHeight * 0.5 - scrollEl.clientHeight / 2);
    };

    const baseSpeedPxPerMs = (baseWpm / 60) * 5 / 1000;
    let currentScrollY = scrollEl.scrollTop;

    const tick = (now: number) => {
      const dt = lastTimeRef.current ? now - lastTimeRef.current : 0;
      lastTimeRef.current = now;

      const targetY = getTargetScrollY();
      targetScrollYRef.current = targetY;
      const delta = targetY - currentScrollY;
      const maxStep = 2;
      const step = Math.sign(delta) * Math.min(Math.abs(delta) * 0.1 + baseSpeedPxPerMs * dt, maxStep);
      currentScrollY = Math.max(0, currentScrollY + step);
      scrollEl.scrollTop = currentScrollY;

      rafRef.current = requestAnimationFrame(tick);
    };

    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, baseWpm, contentJson, scrollRef, contentRef]);
}
