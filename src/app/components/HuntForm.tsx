"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type HuntStatusOption = {
  id: number;
  name: string;
};

type HuntFormProps = {
  statuses: HuntStatusOption[];
};

export default function HuntForm({ statuses }: HuntFormProps) {
  const router = useRouter();
  const defaultStatusId = statuses[0]?.id ?? 0;
  const [name, setName] = useState("");
  const [statusId, setStatusId] = useState(defaultStatusId);
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (statusId === 0 && statuses.length > 0) {
      setStatusId(statuses[0].id);
    }
  }, [statusId, statuses]);

  const statusOptions = useMemo(
    () =>
      statuses.map((status) => (
        <option key={status.id} value={status.id}>
          {status.name}
        </option>
      )),
    [statuses]
  );

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

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/hunts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          huntStatusId: statusId,
          startDate,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to create hunt.");
      }

      const newId = Number(data?.id);
      setName("");
      setStatusId(defaultStatusId);
      setStartDate(new Date().toISOString().slice(0, 10));
      if (Number.isInteger(newId) && newId > 0) {
        router.push(`/hunts/${newId}`);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6"
    >
      <div className="space-y-2">
        <label className="text-sm font-semibold text-[color:var(--foreground)]">
          Hunt name
        </label>
        <input
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
            {statusOptions}
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

      {error ? (
        <p className="text-sm text-rose-300 dark:text-rose-200">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60 dark:text-slate-900"
      >
        {isSubmitting ? "Creating..." : "Create hunt"}
      </button>
    </form>
  );
}
