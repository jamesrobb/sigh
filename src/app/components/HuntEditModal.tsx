"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type HuntStatusOption = {
  id: number;
  name: string;
};

type HuntEditModalProps = {
  huntId: number;
  initialName: string;
  initialStatusId: number;
  initialStartDate: number | Date;
  initialEndDate: number | Date | null;
  statuses: HuntStatusOption[];
  triggerLabel?: string;
  triggerClassName?: string;
};

function toDateInput(value: number | Date | null) {
  if (!value) {
    return "";
  }
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

export default function HuntEditModal({
  huntId,
  initialName,
  initialStatusId,
  initialStartDate,
  initialEndDate,
  statuses,
  triggerLabel = "Edit hunt",
  triggerClassName = "rounded-lg border border-[color:var(--border)] px-3 py-1 text-xs text-[color:var(--muted)] transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--foreground)]",
}: HuntEditModalProps) {
  const router = useRouter();
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [statusId, setStatusId] = useState(initialStatusId);
  const [startDate, setStartDate] = useState(toDateInput(initialStartDate));
  const [endDate, setEndDate] = useState(toDateInput(initialEndDate));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        nameInputRef.current?.focus();
      });
    }
  }, [isOpen]);

  function openModal() {
    setName(initialName);
    setStatusId(initialStatusId);
    setStartDate(toDateInput(initialStartDate));
    setEndDate(toDateInput(initialEndDate));
    setError(null);
    setIsOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Hunt name is required.");
      return;
    }

    if (!statusId) {
      setError("Pick a status.");
      return;
    }

    if (!startDate) {
      setError("Start date is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/hunts/${huntId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          huntStatusId: statusId,
          startDate,
          endDate: endDate.trim() ? endDate.trim() : null,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to update hunt.");
      }

      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button type="button" onClick={openModal} className={triggerClassName}>
        {triggerLabel}
      </button>

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
                Edit hunt
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
                  Hunt name
                </label>
                <input
                  ref={nameInputRef}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Summer 2025 search"
                  className="w-full appearance-none rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[color:var(--foreground)]">
                    Status
                  </label>
                  <select
                    value={statusId}
                    onChange={(event) => setStatusId(Number(event.target.value))}
                    className="w-full appearance-none rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none"
                  >
                    {statuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[color:var(--foreground)]">
                    Start date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="w-full appearance-none rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[color:var(--foreground)]">
                  End date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="w-full appearance-none rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] shadow-none outline-none"
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
                  {isSubmitting ? "Saving..." : "Save hunt"}
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
