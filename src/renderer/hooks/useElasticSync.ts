import { useEffect, useRef, useCallback } from 'react';
import { usePrompterStore } from '../store/prompterStore';
import { useIpc } from './useIpc';

interface UseElasticSyncArgs {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  contentJson: string;
  enabled: boolean;
}

/** Normalize word for fuzzy match: lowercase, strip punctuation. */
function normalizeWord(w: string): string {
  return w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
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

const MATCH_WINDOW = 15;
const LERP_FACTOR = 0.08;
const MAX_STEP_PX = 4;
const BASE_SPEED_PX_PER_WPM = 5 / 60;

export function useElasticSync({ scrollRef, contentRef, contentJson, enabled }: UseElasticSyncArgs): void {
  const { baseWpm } = usePrompterStore();
  const ipc = useIpc();
  const currentWordIndexRef = useRef(0);
  const baseScrollOffsetRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const wordsRef = useRef<string[]>([]);

  wordsRef.current = getWordsFromJson(contentJson);

  const onWord = useCallback((word: string) => {
    const words = wordsRef.current;
    const idx = currentWordIndexRef.current;
    const normalized = normalizeWord(word);
    if (!normalized) return;
    const end = Math.min(idx + MATCH_WINDOW, words.length);
    for (let i = idx; i < end; i++) {
      const scriptWord = normalizeWord(words[i]);
      if (
        scriptWord === normalized ||
        scriptWord.startsWith(normalized) ||
        normalized.startsWith(scriptWord) ||
        scriptWord.includes(normalized)
      ) {
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
    if (enabled) {
      currentWordIndexRef.current = 0;
      baseScrollOffsetRef.current = 0;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !scrollRef.current || !contentRef.current) return;
    const scrollEl = scrollRef.current;
    const contentEl = contentRef.current;
    const words = wordsRef.current;

    const getTargetScrollY = (): number => {
      if (words.length === 0) return 0;
      const idx = Math.min(currentWordIndexRef.current, words.length - 1);
      const wordEl = contentEl.querySelector(`[data-word-index="${idx}"]`);
      if (wordEl && wordEl instanceof HTMLElement) {
        const scrollRect = scrollEl.getBoundingClientRect();
        const wordRect = wordEl.getBoundingClientRect();
        const wordTopInScroll = scrollEl.scrollTop + (wordRect.top - scrollRect.top);
        const target = wordTopInScroll - scrollEl.clientHeight / 2 + wordEl.offsetHeight / 2;
        return Math.max(0, target);
      }
      const child = contentEl.querySelector('p');
      if (!child) return 0;
      const lineHeight = child.offsetHeight * 1.2;
      return Math.max(0, idx * lineHeight * 0.5 - scrollEl.clientHeight / 2);
    };

    const baseSpeedPxPerMs = (baseWpm / 60) * BASE_SPEED_PX_PER_WPM;
    let currentScrollY = scrollEl.scrollTop;
    const maxScroll = Math.max(0, contentEl.scrollHeight - scrollEl.clientHeight);

    const tick = (now: number) => {
      const dt = lastTimeRef.current ? now - lastTimeRef.current : 0;
      lastTimeRef.current = now;

      baseScrollOffsetRef.current = Math.min(
        maxScroll,
        baseScrollOffsetRef.current + baseSpeedPxPerMs * dt
      );
      const speechTargetY = getTargetScrollY();
      const targetY = Math.max(speechTargetY, baseScrollOffsetRef.current);
      const delta = targetY - currentScrollY;
      const lerpStep = delta * LERP_FACTOR;
      const step = Math.sign(delta) * Math.min(Math.abs(lerpStep), MAX_STEP_PX);
      currentScrollY = Math.max(0, Math.min(maxScroll, currentScrollY + step));
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
