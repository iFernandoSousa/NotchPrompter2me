import { useEffect, useRef } from 'react';
import { useScriptStore } from '../../store/scriptStore';
import { usePrompterStore } from '../../store/prompterStore';
import { useElasticSync } from '../../hooks/useElasticSync';
import { useIpc } from '../../hooks/useIpc';

/** Renders script content as read-only with scroll driven by elastic sync or base WPM. */
export default function PrompterView() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { settings, editorContentJson, setEditorContentJson } = useScriptStore();
  const { playbackState, setScrollPosition } = usePrompterStore();
  const ipc = useIpc();

  useEffect(() => {
    if (!ipc) return;
    const unsub = ipc.onEditorContentUpdate((content) => setEditorContentJson(content));
    return unsub;
  }, [ipc, setEditorContentJson]);

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
      className="h-full w-full overflow-auto overflow-x-hidden scroll-smooth"
      style={{
        fontFamily: settings.fontFamily,
        fontSize: `${settings.fontSize}px`,
        color: settings.fontColor,
      }}
    >
      <div ref={contentRef} className="p-4 min-h-full">
        {content}
      </div>
    </div>
  );
}

type TextNode = { type: string; text?: string; marks?: Array<{ type: string }> };
type BlockNode = { type: string; content?: TextNode[] };

function renderContent(json: string, settings: { fontFamily: string; fontSize: number; fontColor: string }): React.ReactNode {
  try {
    const doc = JSON.parse(json) as { content?: BlockNode[] };
    if (!doc?.content) return null;
    return (
      <div style={{ fontFamily: settings.fontFamily, fontSize: settings.fontSize, color: settings.fontColor }}>
        {doc.content.map((node, i) => {
          if (node.type === 'paragraph') {
            const runs = node.content ?? [];
            return (
              <p key={i} className="mb-2">
                {runs.map((run, j) => {
                  if (run.type !== 'text' || run.text == null) return null;
                  const marks = new Set(run.marks?.map((m) => m.type) ?? []);
                  let el: React.ReactNode = run.text;
                  if (marks.has('strike')) el = <s>{el}</s>;
                  if (marks.has('underline')) el = <u>{el}</u>;
                  if (marks.has('italic')) el = <em>{el}</em>;
                  if (marks.has('bold')) el = <strong>{el}</strong>;
                  return <span key={j}>{el}</span>;
                })}
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
