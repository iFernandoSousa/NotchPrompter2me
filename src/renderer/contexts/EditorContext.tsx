import React, { createContext, useContext, useEffect } from 'react';
import { useEditor, EditorContent, type Content } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import { useScriptStore } from '../store/scriptStore';
import { useIpc } from '../hooks/useIpc';

const extensions = [
  Document,
  Paragraph,
  Text,
  Bold,
  Italic,
  Underline,
  Strike,
];

const EditorContext = createContext<Editor | null>(null);

export function useEditorContext() {
  return useContext(EditorContext);
}

function parseContent(json: string): Content {
  try {
    const parsed = JSON.parse(json) as Content;
    return parsed ?? { type: 'doc', content: [{ type: 'paragraph', content: [] }] };
  } catch {
    return { type: 'doc', content: [{ type: 'paragraph', content: [] }] };
  }
}

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const { editorContentJson, setEditorContentJson } = useScriptStore();
  const ipc = useIpc();

  const editor = useEditor({
    extensions,
    content: parseContent(editorContentJson),
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none min-h-[200px] p-4 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON());
      setEditorContentJson(json);
      ipc?.sendEditorContent(json);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = JSON.stringify(editor.getJSON());
    if (current === editorContentJson) return;
    editor.commands.setContent(parseContent(editorContentJson), false);
  }, [editor, editorContentJson]);

  return (
    <EditorContext.Provider value={editor}>
      {children}
    </EditorContext.Provider>
  );
}
