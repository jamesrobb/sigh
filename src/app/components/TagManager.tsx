"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FastInput, { FastInputItem } from "@/app/components/FastInput";

type TagOption = {
  id: number;
  name: string;
};

type TagManagerProps = {
  subjectId: number;
  linkEndpoint: string;
  assignedTags: TagOption[];
  allTags: TagOption[];
};

export default function TagManager({
  subjectId,
  linkEndpoint,
  assignedTags,
  allTags,
}: TagManagerProps) {
  const router = useRouter();
  const [tags, setTags] = useState<TagOption[]>(assignedTags);
  const [availableTags, setAvailableTags] = useState<TagOption[]>(allTags);
  const [query, setQuery] = useState("");
  const [value, setValue] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const tagItems = useMemo<FastInputItem[]>(
    () =>
      availableTags.map((tag) => ({
        id: tag.id,
        label: tag.name,
      })),
    [availableTags]
  );

  const selectedTagIds = useMemo(() => new Set(tags.map((tag) => tag.id)), [tags]);

  function focusInput() {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  async function linkTag(tagId: number, tagName?: string) {
    if (selectedTagIds.has(tagId)) {
      setQuery("");
      setValue(null);
      focusInput();
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(linkEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to add tag.");
      }
      const resolvedName =
        tagName ?? availableTags.find((tag) => tag.id === tagId)?.name ?? "";
      setTags((prev) => [...prev, { id: tagId, name: resolvedName }]);
      setQuery("");
      setValue(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setIsSaving(false);
      focusInput();
    }
  }

  async function createTag(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to create tag.");
      }
      const tagId = Number(data.id);
      const tagName = String(data.name);
      setAvailableTags((prev) => {
        const map = new Map<number, TagOption>();
        for (const entry of prev) {
          map.set(entry.id, entry);
        }
        map.set(tagId, { id: tagId, name: tagName });
        return Array.from(map.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      });
      await linkTag(tagId, tagName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setIsSaving(false);
      focusInput();
    }
  }

  async function removeTag(tagId: number) {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(linkEndpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to remove tag.");
      }
      setTags((prev) => prev.filter((tag) => tag.id !== tagId));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {tags.length === 0 ? (
        <p className="text-sm text-[color:var(--muted)]">No tags yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              type="button"
              key={tag.id}
              onClick={() => removeTag(tag.id)}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent)]/80 bg-[color:var(--accent)] px-3 py-1 text-sm font-semibold text-white transition-colors hover:border-[color:var(--accent)] hover:bg-[color:var(--accent)]/85 hover:text-white dark:text-slate-900 dark:hover:text-slate-900 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
              aria-label={`Remove ${tag.name}`}
            >
              {tag.name}
              <span className="text-xs text-white/80 dark:text-slate-800">
                ×
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-semibold text-[color:var(--foreground)]">
          Add tag
        </label>
        <FastInput
          items={tagItems}
          value={value}
          query={query}
          onQueryChange={setQuery}
          onValueChange={(nextValue) => {
            if (nextValue) {
              setQuery("");
              void linkTag(nextValue);
            }
            setValue(null);
          }}
          onCreate={(name) => createTag(name)}
          placeholder="Start typing to search or create"
          listLimit={15}
          disabled={isSaving}
          inputRef={inputRef}
        />
      </div>

      {error ? (
        <p className="text-sm text-rose-300 dark:text-rose-200">{error}</p>
      ) : null}
    </div>
  );
}
