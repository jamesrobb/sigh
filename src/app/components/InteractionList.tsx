"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Linkify from "linkify-react";
import InteractionModal from "@/app/components/InteractionModal";

type InteractionTypeOption = {
  id: number;
  name: string;
};

type PersonOption = {
  id: number;
  firstName: string;
  lastName: string;
  companyId: number;
  companyName: string;
};

type InteractionEntry = {
  id: number;
  interactionTypeId: number;
  interactionTypeName: string;
  personId: number | null;
  personName: string | null;
  occurredAt: number;
  notes: string | null;
};

type InteractionListProps = {
  roleId: number;
  companyId: number;
  companyName: string;
  interactionTypes: InteractionTypeOption[];
  people: PersonOption[];
  interactions: InteractionEntry[];
};

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

const linkifyOptions = {
  defaultProtocol: "https",
  target: "_blank",
  rel: "noopener noreferrer",
  className: "underline underline-offset-4 text-[color:var(--accent)]",
  validate: { email: false },
};

export default function InteractionList({
  roleId,
  companyId,
  companyName,
  interactionTypes,
  people,
  interactions,
}: InteractionListProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: number) {
    setError(null);
    setIsDeleting(id);
    try {
      const response = await fetch(`/api/interactions/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to delete interaction.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setIsDeleting(null);
    }
  }

  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-xl border-b border-[color:var(--border)] bg-[color:var(--panel-header)] px-4 py-2">
        <h2 className="text-sm font-semibold text-[color:var(--foreground)]">
          Interactions
        </h2>
        <InteractionModal
          roleId={roleId}
          companyId={companyId}
          companyName={companyName}
          interactionTypes={interactionTypes}
          people={people}
        />
      </div>

      <div className="space-y-3 p-6">
        {error ? (
          <p className="text-sm text-rose-300 dark:text-rose-200">{error}</p>
        ) : null}

        {interactions.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">
            No interactions yet.
          </p>
        ) : (
          <div className="space-y-3">
            {interactions.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg border border-[color:var(--border)] bg-black/5 p-4 text-sm text-[color:var(--foreground)] dark:bg-white/5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex-none self-stretch flex items-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[color:var(--border)] bg-[color:var(--panel-header)] text-[color:var(--accent)]">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-6 w-6"
                          aria-hidden="true"
                        >
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-[color:var(--foreground)]">
                          {entry.interactionTypeName}
                        </p>
                        {entry.personId && entry.personName ? (
                          <>
                            <span className="text-xs text-[color:var(--muted)]">
                              with
                            </span>
                            <Link
                              href={`/people/${entry.personId}`}
                              className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel-header)] px-2.5 py-1 text-sm font-semibold text-[color:var(--foreground)] transition-colors hover:border-[color:var(--accent)]"
                            >
                              {entry.personName}
                            </Link>
                          </>
                        ) : null}
                      </div>
                      {entry.notes ? (
                        <p className="text-sm text-[color:var(--muted)] whitespace-pre-wrap">
                          <Linkify options={linkifyOptions}>
                            {entry.notes}
                          </Linkify>
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-none flex-col items-end gap-2">
                    <span className="text-sm text-[color:var(--muted)]">
                      {formatDateTime(entry.occurredAt)}
                    </span>
                    <div className="flex items-center gap-2">
                      <InteractionModal
                        roleId={roleId}
                        companyId={companyId}
                        companyName={companyName}
                        interactionTypes={interactionTypes}
                        people={people}
                        mode="edit"
                        enableShortcut={false}
                        triggerHint={null}
                        triggerLabel="Edit"
                        triggerContainerClassName="flex items-center"
                        triggerClassName="rounded-md border border-[color:var(--border)] px-2 py-0.5 text-xs text-[color:var(--muted)] transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--foreground)]"
                        initialInteraction={{
                          id: entry.id,
                          interactionTypeId: entry.interactionTypeId,
                          personId: entry.personId,
                          occurredAt: entry.occurredAt,
                          notes: entry.notes,
                        }}
                        onSaved={() => router.refresh()}
                      />
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      disabled={isDeleting === entry.id}
                      className="rounded-md border border-[color:var(--border)] px-2 py-0.5 text-xs text-[color:var(--muted)] transition-colors hover:border-rose-400/70 hover:text-rose-200 disabled:opacity-60"
                    >
                      {isDeleting === entry.id ? "Deleting..." : "Delete"}
                    </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
