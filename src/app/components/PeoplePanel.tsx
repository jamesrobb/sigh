"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PersonCreateModal from "@/app/components/PersonCreateModal";
import FastInput, { FastInputItem } from "@/app/components/FastInput";
import { formatPersonName } from "@/lib/personName";

type CompanyOption = {
  id: number;
  name: string;
};

type TagOption = {
  id: number;
  name: string;
};

type PersonSummary = {
  id: number;
  firstName: string;
  lastName: string;
  title: string | null;
  email: string | null;
  linkedin: string | null;
  phone: string | null;
  companyId: number;
  companyName: string;
  tagIds: number[];
  interactionCount: number;
  lastInteractionAt: number | null;
};

type PeoplePanelProps = {
  people: PersonSummary[];
  companies: CompanyOption[];
  tags: TagOption[];
};

export default function PeoplePanel({ people, companies, tags }: PeoplePanelProps) {
  const router = useRouter();
  const [availableTags, setAvailableTags] = useState<TagOption[]>(tags);
  const [selectedTags, setSelectedTags] = useState<TagOption[]>([]);
  const [tagQuery, setTagQuery] = useState("");
  const [tagValue, setTagValue] = useState<number | null>(null);

  const sortedPeople = [...people].sort((a, b) => {
    const firstCompare = a.firstName.localeCompare(b.firstName);
    if (firstCompare !== 0) {
      return firstCompare;
    }
    const lastCompare = a.lastName.localeCompare(b.lastName);
    if (lastCompare !== 0) {
      return lastCompare;
    }
    return a.id - b.id;
  });

  const tagItems = useMemo<FastInputItem[]>(
    () =>
      availableTags.map((tag) => ({
        id: tag.id,
        label: tag.name,
      })),
    [availableTags]
  );

  const selectedTagIds = useMemo(
    () => new Set(selectedTags.map((tag) => tag.id)),
    [selectedTags]
  );

  const filteredPeople =
    selectedTags.length === 0
      ? sortedPeople
      : sortedPeople.filter((entry) =>
          entry.tagIds.some((id) => selectedTagIds.has(id))
            ? Array.from(selectedTagIds).every((id) => entry.tagIds.includes(id))
            : false
        );

  async function handleCreateTag(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const response = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return;
    }
    const createdTag: TagOption = {
      id: Number(data.id),
      name: String(data.name),
    };
    setAvailableTags((prev) => {
      const map = new Map<number, TagOption>();
      for (const entry of prev) {
        map.set(entry.id, entry);
      }
      map.set(createdTag.id, createdTag);
      return Array.from(map.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    });
    setSelectedTags((prev) => {
      if (prev.some((tag) => tag.id === createdTag.id)) {
        return prev;
      }
      return [...prev, createdTag];
    });
    setTagQuery("");
    setTagValue(null);
  }

  function shouldIgnoreCardClick(
    target: EventTarget | null,
    currentTarget: EventTarget | null
  ) {
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    const interactive = target.closest(
      "a,button,input,textarea,select,option,label,[role='button']"
    );
    return Boolean(interactive && interactive !== currentTarget);
  }

  function formatDateTime(value: number | null) {
    if (!value) {
      return "N/A";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] overflow-visible">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-xl border-b border-[color:var(--border)] bg-[color:var(--panel-header)] px-4 py-2">
        <div className="group relative" aria-describedby="people-sort-tooltip">
          <h2 className="text-sm font-semibold text-[color:var(--foreground)]">
            People
          </h2>
          <div
            id="people-sort-tooltip"
            role="tooltip"
            className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-72 translate-y-1 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-xs text-[color:var(--foreground)] opacity-0 shadow-lg transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
          >
            People are sorted in ascending order by first name, last name.
          </div>
        </div>
        <PersonCreateModal companies={companies} />
      </div>
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[color:var(--foreground)]">
            Filter by tags
          </label>
          <FastInput
            items={tagItems}
            value={tagValue}
            query={tagQuery}
            onQueryChange={setTagQuery}
            onValueChange={(nextValue) => {
              if (nextValue) {
                const match = availableTags.find((tag) => tag.id === nextValue);
                if (match && !selectedTagIds.has(match.id)) {
                  setSelectedTags((prev) => [...prev, match]);
                }
                setTagQuery("");
              }
              setTagValue(null);
            }}
            onCreate={handleCreateTag}
            placeholder="Start typing to search or create"
            listLimit={15}
          />
          {selectedTags.length > 0 ? (
            <div className="mt-4 mb-4 flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent)]/80 bg-[color:var(--accent)] px-3 py-1 text-xs font-semibold text-white dark:text-slate-900"
                >
                  {tag.name}
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedTags((prev) =>
                        prev.filter((entry) => entry.id !== tag.id)
                      )
                    }
                    className="text-xs text-white/80 transition-colors hover:text-white dark:text-slate-800 dark:hover:text-slate-700"
                    aria-label={`Remove ${tag.name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {filteredPeople.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">
            {selectedTags.length > 0
              ? "No people match this selection."
              : "No people yet."}
          </p>
        ) : (
          <div className="grid gap-4">
            {filteredPeople.map((entry) => (
              <div
                key={entry.id}
                tabIndex={0}
                onClick={(event) => {
                  if (shouldIgnoreCardClick(event.target, event.currentTarget)) {
                    return;
                  }
                  router.push(`/people/${entry.id}`);
                }}
                onKeyDown={(event) => {
                  if (shouldIgnoreCardClick(event.target, event.currentTarget)) {
                    return;
                  }
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/people/${entry.id}`);
                  }
                }}
                className="cursor-pointer rounded-lg border border-[color:var(--border)] bg-black/5 p-4 text-sm text-[color:var(--foreground)] transition-colors hover:border-[color:var(--accent)] dark:bg-white/5"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-none pt-0.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--panel-header)] text-[color:var(--accent)]">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path d="M20 21a8 8 0 0 0-16 0" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex flex-1 items-start justify-between gap-4">
                    <div className="min-w-0 space-y-2">
                      <p className="text-base font-semibold text-[color:var(--foreground)]">
                        <Link
                          href={`/people/${entry.id}`}
                          className="transition-colors hover:text-[color:var(--accent)]"
                        >
                          {formatPersonName(entry.firstName, entry.lastName)}
                        </Link>
                        {entry.title ? (
                          <span className="text-[color:var(--muted)]">
                            {" "}
                            ({entry.title})
                          </span>
                        ) : null}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[color:var(--muted)]">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm border border-[color:var(--border)]">
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-3.5 w-3.5 text-[color:var(--muted)]"
                              aria-hidden="true"
                            >
                              <rect x="4" y="3" width="16" height="18" rx="2" />
                              <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" />
                              <path d="M9 21v-4h6v4" />
                            </svg>
                          </span>
                          <Link
                            href={`/companies/${entry.companyId}`}
                            className="underline underline-offset-4"
                          >
                            {entry.companyName}
                          </Link>
                        </span>
                        {entry.email ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm border border-[color:var(--border)]">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-3.5 w-3.5 text-[color:var(--muted)]"
                                aria-hidden="true"
                              >
                                <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2" />
                                <path d="m22 8-10 6L2 8" />
                              </svg>
                            </span>
                            <a
                              href={`mailto:${entry.email}`}
                              className="underline underline-offset-4 break-all"
                            >
                              {entry.email}
                            </a>
                          </span>
                        ) : null}
                        {entry.linkedin ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm border border-[color:var(--border)]">
                              <svg
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="h-3.5 w-3.5 text-[color:var(--muted)]"
                                aria-hidden="true"
                              >
                                <path d="M20.45 20.45h-3.56v-5.55c0-1.32-.02-3.02-1.84-3.02-1.84 0-2.12 1.44-2.12 2.93v5.64H9.37V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.36-1.85 3.59 0 4.25 2.37 4.25 5.45v6.29ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14Zm-1.78 13.02h3.56V9H3.56v11.45Z" />
                              </svg>
                            </span>
                            <a
                              href={
                                entry.linkedin.startsWith("http")
                                  ? entry.linkedin
                                  : `https://${entry.linkedin}`
                              }
                              className="underline underline-offset-4 break-all"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {entry.linkedin.startsWith("http")
                                ? entry.linkedin
                                : `https://${entry.linkedin}`}
                            </a>
                          </span>
                        ) : null}
                        {entry.phone ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm border border-[color:var(--border)]">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-3.5 w-3.5 text-[color:var(--muted)]"
                                aria-hidden="true"
                              >
                                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" />
                              </svg>
                            </span>
                            <span>{entry.phone}</span>
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="shrink-0 text-right text-xs text-[color:var(--muted)]">
                      <div className="text-[color:var(--foreground)]">
                        Last interaction: {formatDateTime(entry.lastInteractionAt)}
                      </div>
                      <div>Interactions: {entry.interactionCount}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
