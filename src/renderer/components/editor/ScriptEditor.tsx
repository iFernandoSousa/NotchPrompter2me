import { EditorContent } from '@tiptap/react';
import { useEditorContext } from '../../contexts/EditorContext';

export default function ScriptEditor() {
  const editor = useEditorContext();
  if (!editor) return <div className="p-4 text-zinc-500">Loading editor…</div>;
  return <EditorContent editor={editor} />;
}
