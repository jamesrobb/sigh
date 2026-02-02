"use client";

import { useRouter } from "next/navigation";

type CompanySummary = {
  id: number;
  name: string;
  url: string | null;
  linkedin: string | null;
  roleCount: number;
  personCount: number;
};

type CompanyListPanelProps = {
  companies: CompanySummary[];
};

export default function CompanyListPanel({ companies }: CompanyListPanelProps) {
  const router = useRouter();

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
    <div className="grid gap-4">
      {companies.map((entry) => (
        <div
          key={entry.id}
          tabIndex={0}
          onClick={(event) => {
            if (shouldIgnoreCardClick(event.target, event.currentTarget)) {
              return;
            }
            router.push(`/companies/${entry.id}`);
          }}
          onKeyDown={(event) => {
            if (shouldIgnoreCardClick(event.target, event.currentTarget)) {
              return;
            }
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              router.push(`/companies/${entry.id}`);
            }
          }}
          className="cursor-pointer rounded-xl border border-[color:var(--border)] bg-black/5 p-5 transition-colors hover:border-[color:var(--accent)] dark:bg-white/5"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
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
                    <rect x="4" y="3" width="16" height="18" rx="2" />
                    <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" />
                    <path d="M9 21v-4h6v4" />
                  </svg>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold text-[color:var(--foreground)]">
                  {entry.name}
                </p>
                {(entry.url || entry.linkedin) && (
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[color:var(--muted)]">
                    {entry.url ? (
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
                            <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 4" />
                            <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L13 20" />
                          </svg>
                        </span>
                        <a
                          href={
                            entry.url.startsWith("http")
                              ? entry.url
                              : `https://${entry.url}`
                          }
                          className="underline underline-offset-4"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {entry.url.startsWith("http")
                            ? entry.url
                            : `https://${entry.url}`}
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
                  </div>
                )}
              </div>
            </div>
            <div className="text-xs text-[color:var(--muted)]">
              <div className="text-[color:var(--foreground)]">
                Roles: {entry.roleCount}
              </div>
              <div>People: {entry.personCount}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
