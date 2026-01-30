"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FastInput, { FastInputItem } from "@/app/components/FastInput";

type InteractionTypeOption = {
  id: number;
  name: string;
};

type InteractionSeed = {
  id: number;
  interactionTypeId: number;
  occurredAt: number | string;
  notes: string | null;
};

type PersonInteractionModalProps = {
  personId: number;
  interactionTypes: InteractionTypeOption[];
  mode?: "create" | "edit";
  initialInteraction?: InteractionSeed;
  triggerLabel?: string;
  triggerHint?: string | null;
  enableShortcut?: boolean;
  onSaved?: () => void;
  triggerClassName?: string;
  triggerContainerClassName?: string;
};

export default function PersonInteractionModal({
  personId,
  interactionTypes,
  mode = "create",
  initialInteraction,
  triggerLabel,
  triggerHint,
  enableShortcut,
  onSaved,
  triggerClassName,
  triggerContainerClassName,
}: PersonInteractionModalProps) {
  const router = useRouter();
  const listLimit = 15;
  const isEditMode = mode === "edit";
  const resolvedTriggerLabel =
    triggerLabel ?? (isEditMode ? "Edit" : "Add interaction");
  const resolvedTriggerHint =
    triggerHint !== undefined
      ? triggerHint
      : isEditMode
        ? null
        : "Press 'c' to create to add interaction or click";
  const allowShortcut = enableShortcut ?? !isEditMode;
  const resolvedTriggerContainerClassName =
    triggerContainerClassName ??
    "flex flex-wrap items-center gap-2 text-xs text-[color:var(--muted)]";
  const resolvedTriggerClassName =
    triggerClassName ??
    "rounded-lg border border-[color:var(--border)] px-3 py-1 text-xs text-[color:var(--muted)] transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--foreground)]";

  const [isOpen, setIsOpen] = useState(false);
  const [types, setTypes] = useState<InteractionTypeOption[]>(() =>
    [...interactionTypes].sort((a, b) => a.id - b.id)
  );
  const [typeQuery, setTypeQuery] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [occurredDate, setOccurredDate] = useState("");
  const [occurredTime, setOccurredTime] = useState("");
  const [selectedTimeId, setSelectedTimeId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isOpen]);

  useEffect(() => {
    if (!allowShortcut) {
      return;
    }

    function handleShortcut(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "c") {
        return;
      }
      if (isOpen) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      openModal();
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [allowShortcut, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (isEditMode && initialInteraction) {
      return;
    }
    const parts = getNowParts();
    setOccurredDate(parts.date);
    setOccurredTime(parts.time);
    setSelectedTimeId(getTimeId(parts.time));
  }, [initialInteraction, isEditMode, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let active = true;
    fetch("/api/person-interaction-types")
      .then((response) => response.json())
      .then((data) => {
        if (!active || !Array.isArray(data?.types)) {
          return;
        }
        const nextTypes = (data.types as Array<{ id: number; name: string }>)
          .map((entry) => ({ id: Number(entry.id), name: entry.name }))
          .sort((a, b) => a.id - b.id);
        setTypes(nextTypes);
      })
      .catch(() => null);

    return () => {
      active = false;
    };
  }, [isOpen]);

  const typeItems = useMemo<FastInputItem[]>(
    () =>
      types.map((type) => ({
        id: type.id,
        label: type.name,
      })),
    [types]
  );

  function getNowParts() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const local = new Date(now.getTime() - offset).toISOString();
    return {
      date: local.slice(0, 10),
      time: local.slice(11, 16),
    };
  }

  function formatDateTimeParts(value: number | string) {
    const date = typeof value === "number" ? new Date(value) : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return getNowParts();
    }
    const offset = date.getTimezoneOffset() * 60000;
    const local = new Date(date.getTime() - offset).toISOString();
    return {
      date: local.slice(0, 10),
      time: local.slice(11, 16),
    };
  }

  function getTimeId(value: string) {
    const [hours, minutes] = value.split(":").map((part) => Number(part));
    if (
      !Number.isInteger(hours) ||
      !Number.isInteger(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }
    return hours * 60 + minutes;
  }

  const timeItems = useMemo<FastInputItem[]>(() => {
    const entries: FastInputItem[] = [];
    for (let hour = 0; hour < 24; hour += 1) {
      for (let minute = 0; minute < 60; minute += 15) {
        const label = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        entries.push({ id: hour * 60 + minute, label });
      }
    }
    return entries;
  }, []);

  function applyInitialValues(seed: InteractionSeed) {
    const typeMatch = types.find((type) => type.id === seed.interactionTypeId);
    setSelectedTypeId(seed.interactionTypeId);
    setTypeQuery(typeMatch?.name ?? "");
    const parts = formatDateTimeParts(seed.occurredAt);
    setOccurredDate(parts.date);
    setOccurredTime(parts.time);
    setSelectedTimeId(getTimeId(parts.time));
    setNotes(seed.notes ?? "");
    setError(null);
  }

  function resetForm() {
    setTypeQuery("");
    setSelectedTypeId(null);
    const parts = getNowParts();
    setOccurredDate(parts.date);
    setOccurredTime(parts.time);
    setSelectedTimeId(getTimeId(parts.time));
    setNotes("");
    setError(null);
  }

  async function handleCreateType(rawName?: string) {
    setError(null);
    const name = (rawName ?? typeQuery).trim();
    if (!name) {
      setError("Interaction type name is required.");
      return;
    }

    const response = await fetch("/api/person-interaction-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(data?.error ?? "Failed to create interaction type.");
      return;
    }

    const newType: InteractionTypeOption = {
      id: Number(data.id),
      name: data.name,
    };
    setTypes((prev) => {
      const map = new Map<number, InteractionTypeOption>();
      for (const item of prev) {
        map.set(item.id, item);
      }
      map.set(newType.id, newType);
      return Array.from(map.values()).sort((a, b) => a.id - b.id);
    });
    setSelectedTypeId(newType.id);
    setTypeQuery(newType.name);
  }

  function openModal() {
    setError(null);
    if (isEditMode && initialInteraction) {
      applyInitialValues(initialInteraction);
    } else {
      resetForm();
    }
    setIsOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const normalizedTypeQuery = typeQuery.trim().toLowerCase();
    let interactionTypeId = selectedTypeId;
    if (!interactionTypeId && normalizedTypeQuery) {
      const match = types.find(
        (type) => type.name.toLowerCase() === normalizedTypeQuery
      );
      interactionTypeId = match?.id ?? null;
    }

    if (!interactionTypeId) {
      setError("Select an interaction type.");
      return;
    }

    setIsSubmitting(true);
    try {
      const editingInteraction = isEditMode ? initialInteraction : undefined;
      const interactionId = editingInteraction?.id;
      const isEditing = Boolean(interactionId);
      const endpoint = isEditing
        ? `/api/person-interactions/${interactionId}`
        : "/api/person-interactions";
      const method = isEditing ? "PATCH" : "POST";
      const occurredAt =
        occurredDate && occurredTime
          ? `${occurredDate}T${occurredTime}`
          : occurredDate || new Date().toISOString();
      const payload = isEditing
        ? {
            interactionTypeId,
            occurredAt,
            notes: notes.trim() || null,
          }
        : {
            personId,
            interactionTypeId,
            occurredAt,
            notes: notes.trim() || null,
          };

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          data?.error ??
            (isEditing
              ? "Failed to update interaction."
              : "Failed to create interaction.")
        );
      }

      resetForm();
      setIsOpen(false);
      if (onSaved) {
        onSaved();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const modalTitle = isEditMode ? "Edit interaction" : "Add interaction";

  return (
    <>
      <div className={resolvedTriggerContainerClassName}>
        {resolvedTriggerHint ? <span>{resolvedTriggerHint}</span> : null}
        <button
          type="button"
          onClick={openModal}
          className={resolvedTriggerClassName}
        >
          {resolvedTriggerLabel}
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
          <button
            type="button"
            aria-label="Close modal"
            className="absolute inset-0 z-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-2xl ring-1 ring-[color:var(--accent)]/30">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-[color:var(--foreground)]">
                {modalTitle}
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-sm text-[color:var(--muted)] transition-colors hover:text-[color:var(--foreground)]"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[color:var(--foreground)]">
                  Interaction type
                </label>
                <FastInput
                  items={typeItems}
                  value={selectedTypeId}
                  query={typeQuery}
                  onQueryChange={setTypeQuery}
                  onValueChange={setSelectedTypeId}
                  onCreate={(name) => handleCreateType(name)}
                  placeholder="Start typing to search or create"
                  listLimit={listLimit}
                  autoFocus
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[color:var(--foreground)]">
                    Occurred at
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      type="date"
                      value={occurredDate}
                      onChange={(event) => setOccurredDate(event.target.value)}
                      className="w-full appearance-none rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none"
                    />
                    <FastInput
                      items={timeItems}
                      value={selectedTimeId}
                      query={occurredTime}
                      onQueryChange={(value) => {
                        setOccurredTime(value);
                        setSelectedTimeId(getTimeId(value));
                      }}
                      onValueChange={setSelectedTimeId}
                      placeholder="HH:MM"
                      listLimit={15}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[color:var(--foreground)]">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Quick summary or follow-ups."
                  className="w-full resize-y rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none"
                />
              </div>

              {error ? (
                <p className="text-sm text-rose-300 dark:text-rose-200">
                  {error}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-[color:var(--accent)]/85 disabled:opacity-60"
                >
                  {isSubmitting ? "Saving..." : "Save interaction"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-[color:var(--border)] px-4 py-2 text-sm text-[color:var(--muted)] transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--accent)]/10"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
