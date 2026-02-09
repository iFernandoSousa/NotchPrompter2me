import { useState, useEffect } from 'react';
import { EditorContent } from '@tiptap/react';
import { useEditorContext } from '../../contexts/EditorContext';

export default function ScriptEditor() {
  const editor = useEditorContext();
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (!editor) return;
    // Sync initial state
    setIsEmpty(editor.isEmpty);
    // Listen for every content update
    const onUpdate = () => setIsEmpty(editor.isEmpty);
    editor.on('update', onUpdate);
    return () => { editor.off('update', onUpdate); };
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
        Carregando editor…
      </div>
    );
  }

  return (
    <div className="editor-with-lines relative h-full overflow-auto bg-[#17181c]">
      {/* Gutter separator line */}
      <div className="absolute top-0 bottom-0 left-[3rem] w-px bg-white/[0.04] pointer-events-none z-10" />

      {/* Placeholder overlay */}
      {isEmpty && (
        <div className="absolute top-4 left-[3.75rem] text-zinc-600 italic pointer-events-none select-none text-[15px] z-10">
          Digite ou cole seu roteiro aqui…
        </div>
      )}

      <EditorContent editor={editor} className="h-full" />
    </div>
  );
}
