"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Linkify from "linkify-react";
import InteractionModal from "@/app/components/InteractionModal";
import PersonInteractionModal from "@/app/components/PersonInteractionModal";
import { formatPersonName } from "@/lib/personName";

type InteractionTypeOption = {
  id: number;
  name: string;
};

type PersonSummary = {
  id: number;
  firstName: string;
  lastName: string;
  companyId: number;
  companyName: string;
};

type PersonInteractionEntry = {
  id: number;
  interactionTypeId: number;
  interactionTypeName: string;
  occurredAt: number;
  notes: string | null;
  source: "person";
};

type RoleInteractionEntry = {
  id: number;
  interactionTypeId: number;
  interactionTypeName: string;
  occurredAt: number;
  notes: string | null;
  roleId: number;
  roleTitle: string;
  companyId: number;
  companyName: string;
  source: "role";
};

type PersonInteractionListProps = {
  person: PersonSummary;
  personInteractionTypes: InteractionTypeOption[];
  roleInteractionTypes: InteractionTypeOption[];
  personInteractions: Omit<PersonInteractionEntry, "source">[];
  roleInteractions: Omit<RoleInteractionEntry, "source">[];
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

export default function PersonInteractionList({
  person,
  personInteractionTypes,
  roleInteractionTypes,
  personInteractions,
  roleInteractions,
}: PersonInteractionListProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const combined = useMemo(() => {
    const entries: Array<PersonInteractionEntry | RoleInteractionEntry> = [
      ...personInteractions.map((entry) => ({ ...entry, source: "person" as const })),
      ...roleInteractions.map((entry) => ({ ...entry, source: "role" as const })),
    ];
    return entries.sort((a, b) => {
      if (a.occurredAt === b.occurredAt) {
        return b.id - a.id;
      }
      return b.occurredAt - a.occurredAt;
    });
  }, [personInteractions, roleInteractions]);

  async function handleDelete(entry: PersonInteractionEntry | RoleInteractionEntry) {
    setError(null);
    const key = `${entry.source}-${entry.id}`;
    setIsDeleting(key);
    try {
      const endpoint =
        entry.source === "person"
          ? `/api/person-interactions/${entry.id}`
          : `/api/interactions/${entry.id}`;
      const response = await fetch(endpoint, { method: "DELETE" });
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
        <div
          className="group relative inline-flex items-center outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--panel-header)]"
          tabIndex={0}
          aria-describedby="person-interactions-tooltip"
        >
          <h2 className="text-sm font-semibold text-[color:var(--foreground)]">
            Interactions
          </h2>
          <div
            id="person-interactions-tooltip"
            role="tooltip"
            className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-80 translate-y-1 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-xs text-[color:var(--foreground)] opacity-0 shadow-lg transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
          >
            Interactions listed here are interactions directly with the person,
            and interactions from roles the person is associated with.
          </div>
        </div>
        <PersonInteractionModal
          personId={person.id}
          interactionTypes={personInteractionTypes}
        />
      </div>

      <div className="space-y-3 p-6">
        {error ? (
          <p className="text-sm text-rose-300 dark:text-rose-200">{error}</p>
        ) : null}

        {combined.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">
            No interactions yet.
          </p>
        ) : (
          <div className="space-y-3">
            {combined.map((entry) => {
              const deleteKey = `${entry.source}-${entry.id}`;
              const isRole = entry.source === "role";
              return (
                <div
                  key={deleteKey}
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
                          {isRole ? (
                            <>
                              <span className="text-xs text-[color:var(--muted)]">
                                for
                              </span>
                              <Link
                                href={`/roles/${(entry as RoleInteractionEntry).roleId}`}
                                className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel-header)] px-2.5 py-1 text-sm font-semibold text-[color:var(--foreground)] transition-colors hover:border-[color:var(--accent)]"
                              >
                                {(entry as RoleInteractionEntry).roleTitle}
                              </Link>
                              <span className="text-xs text-[color:var(--muted)]">
                                with
                              </span>
                              <Link
                                href={`/companies/${(entry as RoleInteractionEntry).companyId}`}
                                className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel-header)] px-2.5 py-1 text-sm font-semibold text-[color:var(--foreground)] transition-colors hover:border-[color:var(--accent)]"
                              >
                                {(entry as RoleInteractionEntry).companyName}
                              </Link>
                            </>
                          ) : (
                            <span className="text-xs text-[color:var(--muted)]">
                              person interaction
                            </span>
                          )}
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
                        {isRole ? (
                          <InteractionModal
                            roleId={(entry as RoleInteractionEntry).roleId}
                            companyId={(entry as RoleInteractionEntry).companyId}
                            companyName={(entry as RoleInteractionEntry).companyName}
                            interactionTypes={roleInteractionTypes}
                            people={[person]}
                            mode="edit"
                            enableShortcut={false}
                            triggerHint={null}
                            triggerLabel="Edit"
                            triggerContainerClassName="flex items-center"
                            triggerClassName="rounded-md border border-[color:var(--border)] px-2 py-0.5 text-xs text-[color:var(--muted)] transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--foreground)]"
                            initialInteraction={{
                              id: entry.id,
                              interactionTypeId: entry.interactionTypeId,
                              personId: person.id,
                              occurredAt: entry.occurredAt,
                              notes: entry.notes,
                            }}
                            lockPersonId={person.id}
                            lockPersonLabel={`${formatPersonName(
                              person.firstName,
                              person.lastName
                            )} (${person.companyName})`}
                            hidePersonField
                            onSaved={() => router.refresh()}
                          />
                        ) : (
                          <PersonInteractionModal
                            personId={person.id}
                            interactionTypes={personInteractionTypes}
                            mode="edit"
                            enableShortcut={false}
                            triggerHint={null}
                            triggerLabel="Edit"
                            triggerContainerClassName="flex items-center"
                            triggerClassName="rounded-md border border-[color:var(--border)] px-2 py-0.5 text-xs text-[color:var(--muted)] transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--foreground)]"
                            initialInteraction={{
                              id: entry.id,
                              interactionTypeId: entry.interactionTypeId,
                              occurredAt: entry.occurredAt,
                              notes: entry.notes,
                            }}
                            onSaved={() => router.refresh()}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(entry)}
                          disabled={isDeleting === deleteKey}
                          className="rounded-md border border-[color:var(--border)] px-2 py-0.5 text-xs text-[color:var(--muted)] transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--foreground)] disabled:opacity-60"
                        >
                          {isDeleting === deleteKey ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
