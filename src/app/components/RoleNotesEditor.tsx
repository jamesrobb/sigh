"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MDXEditor,
  type MDXEditorProps,
  type MDXEditorMethods,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  linkPlugin,
  linkDialogPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  ListsToggle,
  CreateLink,
  InsertThematicBreak,
  Separator,
} from "@mdxeditor/editor";

type RoleNotesEditorProps = {
  roleId: number;
  initialNotes: string | null;
};

export default function RoleNotesEditor({
  roleId,
  initialNotes,
}: RoleNotesEditorProps) {
  const router = useRouter();
  const editorRef = useRef<MDXEditorMethods>(null);
  const [value, setValue] = useState(initialNotes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const plugins = useMemo<MDXEditorProps["plugins"]>(
    () => [
      headingsPlugin(),
      listsPlugin(),
      quotePlugin(),
      thematicBreakPlugin(),
      linkPlugin(),
      linkDialogPlugin(),
      markdownShortcutPlugin(),
      toolbarPlugin({
        toolbarContents: () => (
          <>
            <UndoRedo />
            <Separator />
            <BlockTypeSelect />
            <BoldItalicUnderlineToggles />
            <Separator />
            <ListsToggle />
            <Separator />
            <CreateLink />
            <InsertThematicBreak />
          </>
        ),
      }),
    ],
    []
  );

  const initialMarkdown = useMemo(() => initialNotes ?? "", [initialNotes]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setValue(initialNotes ?? "");
  }, [initialNotes]);

  async function handleSave() {
    setError(null);
    setSavedMessage(null);
    setIsSaving(true);
    try {
      const cleanedNotes = value.trim();
      const response = await fetch(`/api/roles/${roleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: cleanedNotes === "" ? null : cleanedNotes }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to save notes.");
      }
      setSavedMessage("Saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {isMounted ? (
        <div>
          <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)]">
            <MDXEditor
              ref={editorRef}
              markdown={initialMarkdown}
              plugins={plugins}
              onChange={(markdown) => {
                setValue(markdown);
                setSavedMessage(null);
              }}
              className="mdxeditor-root"
              contentEditableClassName="mdxeditor-root-contenteditable"
            />
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4 text-sm text-[color:var(--muted)]">
          Loading editor…
        </div>
      )}

      {error ? (
        <p className="text-sm text-rose-300 dark:text-rose-200">{error}</p>
      ) : null}
      {savedMessage ? (
        <p className="text-sm text-[color:var(--muted)]">{savedMessage}</p>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-lg border border-transparent bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:border-[color:var(--foreground)] hover:bg-[color:var(--accent)]/85 disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save notes"}
        </button>
      </div>
    </div>
  );
}
