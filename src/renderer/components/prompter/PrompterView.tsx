import { useEffect, useRef } from 'react';
import { useScriptStore } from '../../store/scriptStore';
import { usePrompterStore } from '../../store/prompterStore';
import { useElasticSync } from '../../hooks/useElasticSync';
import { useIpc } from '../../hooks/useIpc';

/** Renders script content as read-only with scroll driven by elastic sync or base WPM. */
export default function PrompterView() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { settings, editorContentJson, setEditorContentJson, setSettings } = useScriptStore();
  const { playbackState, setScrollPosition } = usePrompterStore();
  const ipc = useIpc();

  useEffect(() => {
    if (!ipc) return;
    const unsub = ipc.onEditorContentUpdate((content) => setEditorContentJson(content));
    return unsub;
  }, [ipc, setEditorContentJson]);

  useEffect(() => {
    if (!ipc) return;
    const unsub = ipc.onPrompterSettingsUpdate((settings) => setSettings(settings));
    return unsub;
  }, [ipc, setSettings]);

  useElasticSync({
    scrollRef,
    contentRef,
    contentJson: editorContentJson,
    enabled: playbackState === 'playing',
  });

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const onScroll = () => setScrollPosition(el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [setScrollPosition]);

  const content = renderContent(editorContentJson, settings);

  return (
    <div
      ref={scrollRef}
      className="h-full w-full overflow-auto overflow-x-hidden scroll-smooth bg-black text-center"
      style={{
        fontFamily: settings.fontFamily,
        fontSize: `${settings.fontSize}px`,
        color: settings.fontColor,
      }}
    >
      <div ref={contentRef} className="p-4 min-h-full flex flex-col items-center justify-center">
        {content}
      </div>
    </div>
  );
}

type TextNode = { type: string; text?: string; marks?: Array<{ type: string }> };
type BlockNode = { type: string; content?: TextNode[] };

/** Split text into words and render each with data-word-index for elastic sync scroll targeting. */
function renderContent(json: string, settings: { fontFamily: string; fontSize: number; fontColor: string }): React.ReactNode {
  try {
    const doc = JSON.parse(json) as { content?: BlockNode[] };
    if (!doc?.content) return null;
    let globalWordIndex = 0;
    return (
      <div className="text-center w-full" style={{ fontFamily: settings.fontFamily, fontSize: settings.fontSize, color: settings.fontColor }}>
        {doc.content.map((node, i) => {
          if (node.type === 'paragraph') {
            const runs = node.content ?? [];
            const parts: React.ReactNode[] = [];
            runs.forEach((run, j) => {
              if (run.type !== 'text' || run.text == null) return;
              const marks = new Set(run.marks?.map((m) => m.type) ?? []);
              const words = run.text.split(/(\s+)/);
              words.forEach((segment, wi) => {
                const isSpace = /^\s+$/.test(segment);
                const key = `${i}-${j}-${wi}`;
                if (isSpace) {
                  parts.push(<span key={key}>{segment}</span>);
                } else {
                  const wrap = (x: React.ReactNode) => {
                    if (marks.has('strike')) x = <s>{x}</s>;
                    if (marks.has('underline')) x = <u>{x}</u>;
                    if (marks.has('italic')) x = <em>{x}</em>;
                    if (marks.has('bold')) x = <strong>{x}</strong>;
                    return x;
                  };
                  parts.push(
                    <span key={key} data-word-index={globalWordIndex}>
                      {wrap(segment)}
                    </span>
                  );
                  globalWordIndex += 1;
                }
              });
            });
            return (
              <p key={i} className="mb-2 text-center w-full">
                {parts}
              </p>
            );
          }
          return null;
        })}
      </div>
    );
  } catch {
    return <p className="opacity-70">No script loaded.</p>;
  }
}
