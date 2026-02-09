import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditorContext } from '../../contexts/EditorContext';
import { useScriptStore } from '../../store/scriptStore';
import { useIpc } from '../../hooks/useIpc';
import { useMicCaptureContext } from '../../contexts/MicCaptureContext';

const ToolbarButton = ({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`
      w-8 h-8 rounded-lg text-sm font-semibold flex items-center justify-center
      transition-all duration-150 select-none
      ${
        active
          ? 'bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30'
          : 'text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200'
      }
    `}
  >
    {children}
  </button>
);

const ShortcutBadge = ({ children }: { children: React.ReactNode }) => (
  <kbd className="h-7 px-2 rounded-md bg-white/[0.04] border border-white/[0.06] text-zinc-500 text-[11px] font-mono flex items-center gap-0.5 select-none">
    {children}
  </kbd>
);

/** Mic icon SVG */
const MicIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="1" width="6" height="12" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0" />
    <line x1="12" y1="17" x2="12" y2="21" />
    <line x1="8" y1="21" x2="16" y2="21" />
  </svg>
);

/** Mic-off icon SVG */
const MicOffIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

export default function EditorToolbar() {
  const editor = useEditorContext();
  const ipc = useIpc();
  const { settings } = useScriptStore();
  const mic = useMicCaptureContext();
  const [isDictating, setIsDictating] = useState(false);
  const [amplitude, setAmplitude] = useState(0);
  const needsSpaceRef = useRef(false);

  const handleWord = useCallback((word: string) => {
    console.log(`[EditorToolbar] handleWord called: "${word}", hasEditor=${!!editor}`);
    if (!editor || !word.trim()) return;
    const trimmed = word.trim();
    const prefix = needsSpaceRef.current ? ' ' : '';
    const textToInsert = prefix + trimmed;
    needsSpaceRef.current = true;
    editor.chain().focus('end').insertContent(textToInsert).run();
    console.log(`[EditorToolbar] Inserted: "${textToInsert}"`);
  }, [editor]);

  // Subscribe to word events when dictating
  useEffect(() => {
    console.log(`[EditorToolbar] Word subscription effect: isDictating=${isDictating}, hasIpc=${!!ipc}`);
    if (!isDictating || !ipc) return;
    console.log('[EditorToolbar] Subscribing to vosk.onWord');
    const unsub = ipc.vosk.onWord(handleWord);
    return () => {
      console.log('[EditorToolbar] Unsubscribing from vosk.onWord');
      unsub();
    };
  }, [isDictating, ipc, handleWord]);

  // Subscribe to amplitude for visual feedback
  useEffect(() => {
    if (!isDictating || !ipc) return;
    const unsub = ipc.vosk.onAmplitude((payload) => {
      setAmplitude(payload.amplitude);
    });
    return () => {
      unsub();
      setAmplitude(0);
    };
  }, [isDictating, ipc]);

  const toggleDictation = useCallback(async () => {
    console.log(`[EditorToolbar] toggleDictation: hasIpc=${!!ipc}, hasMic=${!!mic}, isDictating=${isDictating}`);
    if (!ipc || !mic) return;

    if (isDictating) {
      console.log('[EditorToolbar] Stopping dictation');
      mic.stopCapture();
      ipc.vosk.stop();
      setIsDictating(false);
      needsSpaceRef.current = false;
    } else {
      console.log(`[EditorToolbar] Starting dictation, language=${settings.language}`);
      needsSpaceRef.current = !editor?.isEmpty;
      await ipc.vosk.start(settings.language);
      console.log('[EditorToolbar] Vosk started, now starting mic capture');
      await mic.startCapture();
      console.log('[EditorToolbar] Mic capture started, setting isDictating=true');
      setIsDictating(true);
    }
  }, [ipc, mic, isDictating, editor, settings.language]);

  if (!editor) return null;

  const micScale = isDictating ? 1 + amplitude * 0.3 : 1;

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-white/[0.06] flex-shrink-0 bg-[#111215]">
      {/* Format toggles */}
      <ToolbarButton
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Negrito (⌘B)"
      >
        B
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Itálico (⌘I)"
      >
        I
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Sublinhado (⌘U)"
      >
        U
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Tachado (⌘⇧X)"
      >
        S
      </ToolbarButton>

      {/* Separator */}
      <div className="w-px h-5 bg-white/[0.08] mx-2" />

      {/* Keyboard shortcut hints */}
      <div className="flex gap-1">
        <ShortcutBadge>⌘B</ShortcutBadge>
        <ShortcutBadge>⌘I</ShortcutBadge>
        <ShortcutBadge>⌘U</ShortcutBadge>
      </div>

      {/* Spacer to push mic button right */}
      <div className="flex-1" />

      {/* Mic dictation button */}
      <button
        type="button"
        title={isDictating ? 'Stop dictation' : 'Start dictation (voice to text)'}
        onClick={toggleDictation}
        className={`
          relative flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium
          transition-all duration-200 select-none
          ${
            isDictating
              ? 'bg-red-600/20 text-red-400 ring-1 ring-red-500/40'
              : 'text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200'
          }
        `}
      >
        {isDictating && (
          <span className="absolute inset-0 rounded-lg bg-red-500/10 animate-pulse pointer-events-none" />
        )}

        <span
          className="relative z-10 transition-transform duration-150"
          style={{ transform: `scale(${micScale})` }}
        >
          {isDictating ? <MicIcon size={14} /> : <MicOffIcon size={14} />}
        </span>
        <span className="relative z-10">
          {isDictating ? 'Listening…' : 'Dictate'}
        </span>
      </button>
    </div>
  );
}
