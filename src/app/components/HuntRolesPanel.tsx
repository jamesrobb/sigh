"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import RoleCreateModal from "@/app/components/RoleCreateModal";
import FastInput, { FastInputItem } from "@/app/components/FastInput";
import { getStatusTone, STATUS_TONE_STYLES } from "@/lib/statusTone";

type RoleSummary = {
  id: number;
  title: string;
  companyName: string;
  createdAt: number;
  lastInteractionType: string | null;
  lastInteractionAt: number | null;
  status: string;
  tagIds: number[];
};

type TagOption = {
  id: number;
  name: string;
};

type InteractionTypeOption = {
  id: number;
  name: string;
};

type StatItem = {
  key: string;
  label: string;
  value: number;
  tooltip: string;
  tone?: ReturnType<typeof getStatusTone>;
};

type HuntRolesPanelProps = {
  huntId: number;
  roles: RoleSummary[];
  statItems: StatItem[];
  tags: TagOption[];
  statusOptions: string[];
  interactionTypes: InteractionTypeOption[];
};

export default function HuntRolesPanel({
  huntId,
  roles,
  statItems,
  tags,
  statusOptions,
  interactionTypes,
}: HuntRolesPanelProps) {
  const [availableTags, setAvailableTags] = useState<TagOption[]>(tags);
  const [selectedTags, setSelectedTags] = useState<TagOption[]>([]);
  const [tagQuery, setTagQuery] = useState("");
  const [tagValue, setTagValue] = useState<number | null>(null);
  const [statusQuery, setStatusQuery] = useState("");
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
  const [interactionQuery, setInteractionQuery] = useState("");
  const [selectedInteractionId, setSelectedInteractionId] = useState<number | null>(
    null
  );

  const tagItems = useMemo<FastInputItem[]>(
    () =>
      availableTags.map((tag) => ({
        id: tag.id,
        label: tag.name,
      })),
    [availableTags]
  );

  const statusItems = useMemo<FastInputItem[]>(() => {
    const items = statusOptions.map((status, index) => ({
      id: index + 1,
      label: status,
    }));
    return [{ id: -1, label: "All statuses" }, ...items];
  }, [statusOptions]);

  const interactionItems = useMemo<FastInputItem[]>(
    () => [
      { id: -1, label: "All interactions" },
      ...interactionTypes.map((type) => ({
        id: type.id,
        label: type.name,
      })),
    ],
    [interactionTypes]
  );

  const selectedTagIds = useMemo(
    () => new Set(selectedTags.map((tag) => tag.id)),
    [selectedTags]
  );

  const selectedStatusName = useMemo(() => {
    if (!selectedStatusId || selectedStatusId < 1) {
      return null;
    }
    const index = selectedStatusId - 1;
    return statusOptions[index] ?? null;
  }, [selectedStatusId, statusOptions]);

  const selectedInteractionName = useMemo(() => {
    if (!selectedInteractionId || selectedInteractionId < 1) {
      return null;
    }
    return (
      interactionTypes.find((type) => type.id === selectedInteractionId)?.name ??
      null
    );
  }, [interactionTypes, selectedInteractionId]);

  const filteredRoles = useMemo(() => {
    let result = roles;
    if (selectedStatusName) {
      result = result.filter((role) => role.status === selectedStatusName);
    }
    if (selectedInteractionName) {
      result = result.filter(
        (role) => role.lastInteractionType === selectedInteractionName
      );
    }
    return result;
  }, [roles, selectedStatusName, selectedInteractionName]);

  const filteredRolesByTags =
    selectedTags.length === 0
      ? filteredRoles
      : filteredRoles.filter((role) =>
          Array.from(selectedTagIds).every((tagId) =>
            role.tagIds.includes(tagId)
          )
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
  }

  function formatDateTime(value: number) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
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
    <section className="space-y-6">
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] overflow-visible">
        <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-5">
          {statItems.map((item) => {
            const toneStyle = item.tone ? STATUS_TONE_STYLES[item.tone] : null;
            const tooltipId = `hunt-stat-${item.key
              .toLowerCase()
              .replace(/\s+/g, "-")}`;
            return (
              <div
                key={item.key}
                className="group relative"
                aria-describedby={tooltipId}
              >
                <div
                  className={`flex items-center justify-between gap-2 rounded-md border border-[color:var(--border)] px-2.5 py-1.5 text-xs font-semibold ${
                    toneStyle
                      ? `${toneStyle.cellBase} ${toneStyle.text}`
                      : "bg-black/5 text-[color:var(--foreground)] dark:bg-white/5"
                  }`}
                >
                  <span className="uppercase tracking-wide">{item.label}</span>
                  <span className="text-sm">{item.value}</span>
                </div>
                <div
                  id={tooltipId}
                  role="tooltip"
                  className="pointer-events-none absolute left-0 top-full z-20 mt-1 w-64 translate-y-0.5 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-xs text-[color:var(--foreground)] opacity-0 shadow-lg transition duration-150 group-hover:translate-y-0 group-hover:opacity-100"
                >
                  {item.tooltip}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] overflow-visible">
        <div className="flex items-center justify-between rounded-t-xl border-b border-[color:var(--border)] bg-[color:var(--panel-header)] px-4 py-2">
          <h2 className="text-sm font-semibold text-[color:var(--foreground)]">
            Filters
          </h2>
        </div>
        <div className="space-y-5 p-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[color:var(--foreground)]">
              Status
            </label>
            <FastInput
              items={statusItems}
              value={selectedStatusId}
              query={statusQuery}
              onQueryChange={setStatusQuery}
              onValueChange={(nextValue) => {
                if (nextValue === -1) {
                  setSelectedStatusId(null);
                  setStatusQuery("");
                  return;
                }
                setSelectedStatusId(nextValue);
              }}
              placeholder="Select status"
              listLimit={15}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[color:var(--foreground)]">
              Last interaction
            </label>
            <FastInput
              items={interactionItems}
              value={selectedInteractionId}
              query={interactionQuery}
              onQueryChange={setInteractionQuery}
              onValueChange={(nextValue) => {
                if (nextValue === -1) {
                  setSelectedInteractionId(null);
                  setInteractionQuery("");
                  return;
                }
                setSelectedInteractionId(nextValue);
              }}
              placeholder="Select interaction type"
              listLimit={15}
            />
          </div>
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
                  <button
                    type="button"
                    key={tag.id}
                    onClick={() =>
                      setSelectedTags((prev) =>
                        prev.filter((entry) => entry.id !== tag.id)
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent)]/80 bg-[color:var(--accent)] px-3 py-1 text-xs font-semibold text-white transition-colors hover:border-[color:var(--accent)] hover:bg-[color:var(--accent)]/85 hover:text-white dark:text-slate-900 dark:hover:text-slate-900 cursor-pointer"
                    aria-label={`Remove ${tag.name}`}
                  >
                    {tag.name}
                    <span className="text-xs text-white/80 dark:text-slate-800">
                      ×
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] overflow-visible">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-xl border-b border-[color:var(--border)] bg-[color:var(--panel-header)] px-4 py-2">
          <div className="group relative" aria-describedby="roles-sort-tooltip">
            <h2 className="text-sm font-semibold text-[color:var(--foreground)]">
              Roles ({filteredRolesByTags.length})
            </h2>
            <div
              id="roles-sort-tooltip"
              role="tooltip"
              className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-72 translate-y-1 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-xs text-[color:var(--foreground)] opacity-0 shadow-lg transition duration-150 group-hover:translate-y-0 group-hover:opacity-100"
            >
              Roles are sorted in descneding order of last interacton.
            </div>
          </div>
          <RoleCreateModal huntId={huntId} />
        </div>
        <div className="p-6 space-y-4">
          {filteredRolesByTags.length === 0 ? (
            <p className="text-sm text-[color:var(--muted)]">
              No roles match this selection.
            </p>
          ) : (
            <div className="grid gap-4">
                  {filteredRolesByTags.map((row) => {
                    const tone = getStatusTone(row.status);
                    const edgeStyle = STATUS_TONE_STYLES[tone].edge;
                    return (
                    <Link
                      key={row.id}
                      href={`/roles/${row.id}`}
                      className="relative rounded-xl border border-[color:var(--border)] bg-black/5 p-5 transition-colors hover:border-[color:var(--accent)] dark:bg-white/5 overflow-hidden"
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none absolute bottom-0 right-0 h-2 w-28 rounded-tl-lg bg-gradient-to-l ${edgeStyle}`}
                      />
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-[color:var(--foreground)]">
                            {row.title}
                          </p>
                      <p className="text-sm text-[color:var(--muted)]">
                        {row.companyName}
                      </p>
                    </div>
                    <div className="text-right text-xs text-[color:var(--muted)]">
                      <div className="text-[color:var(--foreground)]">
                        {row.lastInteractionType && row.lastInteractionAt ? (
                          <>
                            <span className="text-sm font-semibold text-[color:var(--foreground)]">
                              {row.lastInteractionType}
                            </span>{" "}
                            <span className="text-[color:var(--muted)]">
                              on {formatDateTime(row.lastInteractionAt)}
                            </span>
                          </>
                        ) : (
                          "No interactions"
                        )}
                      </div>
                          <div>Created: {formatDateTime(row.createdAt)}</div>
                        </div>
                      </div>
                    </Link>
                    );
                  })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
