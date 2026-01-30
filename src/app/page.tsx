import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { hunt, huntStatus, role } from "@/db/schema";
import HuntCreateModal from "@/app/components/HuntCreateModal";
import StatusPill from "@/app/components/StatusPill";
import GlobalNavLinks from "@/app/components/GlobalNavLinks";
import BreadcrumbNav from "@/app/components/BreadcrumbNav";

export const dynamic = "force-dynamic";

function formatDate(value: number | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Home() {
  const hunts = db
    .select({
      id: hunt.id,
      name: hunt.name,
      startDate: hunt.startDate,
      endDate: hunt.endDate,
      status: huntStatus.name,
      roleCount: sql<number>`count(${role.id})`.as("role_count"),
    })
    .from(hunt)
    .innerJoin(huntStatus, eq(hunt.huntStatusId, huntStatus.id))
    .leftJoin(role, eq(role.huntId, hunt.id))
    .groupBy(
      hunt.id,
      hunt.name,
      hunt.startDate,
      hunt.endDate,
      huntStatus.name
    )
    .orderBy(desc(hunt.startDate), desc(hunt.id))
    .all();

  const statuses = db
    .select({ id: huntStatus.id, name: huntStatus.name })
    .from(huntStatus)
    .orderBy(huntStatus.name)
    .all();

  return (
    <main className="box-border px-6 pt-12 pb-10">
      <div className="fixed inset-x-0 top-0 z-30">
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex h-12 items-center justify-between rounded-b-lg border border-t-0 border-[color:var(--border)] bg-[color:var(--card)] px-6">
            <BreadcrumbNav items={[{ label: "Hunts" }]} />
            <GlobalNavLinks />
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 pt-6">
        <header className="flex flex-col gap-4 px-2">
          <p className="text-xs tracking-[0.3em] text-[color:var(--muted)]">
            IT'S TIME AGAIN FOR A JOB HUNT...
          </p>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold text-[color:var(--foreground)]">
              Sigh
            </h1>
            <p className="max-w-2xl text-base text-[color:var(--muted)]">
              Manage your job hunt quickly.
            </p>
          </div>
        </header>

        <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-xl border-b border-[color:var(--border)] bg-[color:var(--panel-header)] px-4 py-2">
            <div className="group relative" aria-describedby="hunts-sort-tooltip">
              <h2 className="text-sm font-semibold text-[color:var(--foreground)]">
                Hunts
              </h2>
              <div
                id="hunts-sort-tooltip"
                role="tooltip"
                className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-72 translate-y-1 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-xs text-[color:var(--foreground)] opacity-0 shadow-lg transition duration-150 group-hover:translate-y-0 group-hover:opacity-100"
              >
                Hunts are sorted in descending order of creation date.
              </div>
            </div>
            <HuntCreateModal statuses={statuses} />
          </div>
          <div className="p-6">
            {hunts.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">
                No hunts yet. Create your first one to start tracking roles and
                interactions.
              </p>
            ) : (
              <div className="grid gap-4">
                {hunts.map((huntRow) => (
                  <Link
                    key={huntRow.id}
                    href={`/hunts/${huntRow.id}`}
                    className="rounded-xl border border-[color:var(--border)] bg-black/5 p-5 transition-colors hover:border-[color:var(--accent)] dark:bg-white/5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-lg font-semibold text-[color:var(--foreground)]">
                          {huntRow.name}
                        </p>
                        <p className="text-sm text-[color:var(--muted)]">
                          Started {formatDate(huntRow.startDate)}
                        </p>
                      </div>
                      <StatusPill status={huntRow.status} />
                    </div>
                    <div className="mt-4 text-sm text-[color:var(--muted)]">
                      {huntRow.roleCount} roles tracked
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
