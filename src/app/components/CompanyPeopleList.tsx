"use client";

import { useRouter } from "next/navigation";
import { formatPersonName } from "@/lib/personName";

type PersonSummary = {
  id: number;
  firstName: string;
  lastName: string;
  title: string | null;
  email: string | null;
  linkedin: string | null;
  phone: string | null;
};

type CompanyPeopleListProps = {
  people: PersonSummary[];
};

export default function CompanyPeopleList({ people }: CompanyPeopleListProps) {
  const router = useRouter();

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

  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] overflow-hidden">
      <div className="flex items-center justify-between rounded-t-xl border-b border-[color:var(--border)] bg-[color:var(--panel-header)] px-4 py-2">
        <div className="group relative" aria-describedby="company-people-sort-tooltip">
          <h2 className="text-sm font-semibold text-[color:var(--foreground)]">
            People
          </h2>
          <div
            id="company-people-sort-tooltip"
            role="tooltip"
            className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-72 translate-y-1 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-xs text-[color:var(--foreground)] opacity-0 shadow-lg transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
          >
            People are sorted in ascending order by first name, last name.
          </div>
        </div>
      </div>
      <div className="p-6">
        {sortedPeople.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">
            No people linked to this company yet.
          </p>
        ) : (
          <div className="grid gap-4">
            {sortedPeople.map((entry) => (
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
                  <div className="flex flex-1 flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-base font-semibold text-[color:var(--foreground)]">
                        {formatPersonName(entry.firstName, entry.lastName)}
                        {entry.title ? (
                          <span className="text-[color:var(--muted)]">
                            {" "}
                            ({entry.title})
                          </span>
                        ) : null}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[color:var(--muted)]">
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
                              className="underline underline-offset-4"
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
                              className="underline underline-offset-4"
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
