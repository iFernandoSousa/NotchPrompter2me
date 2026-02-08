import { useEditorContext } from '../../contexts/EditorContext';

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
    className={`px-3 py-1.5 rounded text-sm font-medium ${
      active ? 'bg-zinc-600 text-white' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
    }`}
  >
    {children}
  </button>
);

export default function EditorToolbar() {
  const editor = useEditorContext();

  if (!editor) return null;

  return (
    <div className="flex gap-1">
      <ToolbarButton
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        B
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        I
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline"
      >
        U
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        S
      </ToolbarButton>
    </div>
  );
}
