import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";

const COLORS = [
  "#f5f5f5", "#F0B400", "#ffffff",
  "#ff6b6b", "#4ecdc4", "#a8e6cf",
  "#6c5ce7", "#fd79a8", "#fdcb6e",
];

const ToolbarBtn = ({ onClick, active, title, children }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    title={title}
    className="px-2 py-1 text-xs rounded transition-colors"
    style={{
      backgroundColor: active ? "var(--app-text)" : "transparent",
      color: active ? "var(--app-bg)" : "var(--app-text-soft)",
      border: "1px solid var(--app-border-strong)",
    }}
  >
    {children}
  </button>
);

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div
      className="rounded overflow-hidden"
      style={{ border: "1px solid var(--app-border-strong)" }}
    >
      {/* Toolbar */}
      <div
        className="flex flex-wrap gap-1 p-2 border-b"
        style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-overlay)" }}
      >
        {/* Text format */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
          <b>B</b>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
          <i>I</i>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
          <u>U</u>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strike">
          <s>S</s>
        </ToolbarBtn>

        <div className="w-px mx-1" style={{ background: "var(--app-border)" }} />

        {/* Headings */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
          H2
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
          H3
        </ToolbarBtn>

        <div className="w-px mx-1" style={{ background: "var(--app-border)" }} />

        {/* Lists */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Lista">
          • Lista
        </ToolbarBtn>

        <div className="w-px mx-1" style={{ background: "var(--app-border)" }} />

        {/* Alignment */}
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Izquierda">
          ←
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Centro">
          ↔
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Derecha">
          →
        </ToolbarBtn>

        <div className="w-px mx-1" style={{ background: "var(--app-border)" }} />

        {/* Colors */}
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(c).run(); }}
              title={c}
              className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: editor.isActive("textStyle", { color: c }) ? "var(--app-gold)" : "var(--app-border)",
              }}
            />
          ))}
        </div>

        <div className="w-px mx-1" style={{ background: "var(--app-border)" }} />

        {/* Clear */}
        <ToolbarBtn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Limpiar formato">
          ✕
        </ToolbarBtn>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="rich-editor"
        style={{ minHeight: "160px" }}
      />
    </div>
  );
}
