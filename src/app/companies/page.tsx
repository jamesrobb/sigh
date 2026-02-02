import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { company, interactionPerson, interactionRole, person, role } from "@/db/schema";
import CompanyCreateModal from "@/app/components/CompanyCreateModal";
import CompanyListPanel from "@/app/components/CompanyListPanel";
import GlobalNavLinks from "@/app/components/GlobalNavLinks";
import BreadcrumbNav from "@/app/components/BreadcrumbNav";

export const dynamic = "force-dynamic";

export default function CompaniesIndexPage() {
  const companies = db
    .select({
      id: company.id,
      name: company.name,
      url: company.url,
      linkedin: company.linkedin,
    })
    .from(company)
    .orderBy(asc(company.name))
    .all();

  const roleCounts = db
    .select({
      companyId: role.companyId,
      count: sql<number>`count(${role.id})`.as("count"),
    })
    .from(role)
    .groupBy(role.companyId)
    .all();

  const personCounts = db
    .select({
      companyId: person.companyId,
      count: sql<number>`count(${person.id})`.as("count"),
    })
    .from(person)
    .groupBy(person.companyId)
    .all();

  const roleCountByCompany = new Map(
    roleCounts.map((entry) => [Number(entry.companyId), Number(entry.count)])
  );
  const personCountByCompany = new Map(
    personCounts.map((entry) => [Number(entry.companyId), Number(entry.count)])
  );

  const roleInteractionDates = db
    .select({
      companyId: interactionRole.companyId,
      lastInteractionAt: sql<number>`max(${interactionRole.occurredAt})`.as(
        "last_interaction_at"
      ),
    })
    .from(interactionRole)
    .groupBy(interactionRole.companyId)
    .all();

  const personInteractionDates = db
    .select({
      companyId: person.companyId,
      lastInteractionAt: sql<number>`max(${interactionPerson.occurredAt})`.as(
        "last_interaction_at"
      ),
    })
    .from(interactionPerson)
    .innerJoin(person, eq(interactionPerson.personId, person.id))
    .groupBy(person.companyId)
    .all();

  const lastInteractionByCompany = new Map<number, number>();
  for (const entry of roleInteractionDates) {
    if (entry.lastInteractionAt === null || entry.lastInteractionAt === undefined) {
      continue;
    }
    lastInteractionByCompany.set(
      Number(entry.companyId),
      Number(entry.lastInteractionAt)
    );
  }
  for (const entry of personInteractionDates) {
    if (entry.lastInteractionAt === null || entry.lastInteractionAt === undefined) {
      continue;
    }
    const companyId = Number(entry.companyId);
    const current = lastInteractionByCompany.get(companyId);
    const next = Number(entry.lastInteractionAt);
    if (current === undefined || next > current) {
      lastInteractionByCompany.set(companyId, next);
    }
  }
  const companySummaries = companies.map((entry) => ({
    ...entry,
    roleCount: roleCountByCompany.get(entry.id) ?? 0,
    personCount: personCountByCompany.get(entry.id) ?? 0,
    lastInteractionAt: lastInteractionByCompany.get(entry.id) ?? null,
  }));

  return (
    <main className="box-border px-6 pt-12 pb-10">
      <div className="fixed inset-x-0 top-0 z-30">
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex h-12 items-center justify-between rounded-b-lg border border-t-0 border-[color:var(--border)] bg-[color:var(--card)] px-6">
            <BreadcrumbNav items={[{ label: "Companies" }]} />
            <GlobalNavLinks />
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 pt-6">
        <header className="space-y-2 px-2">
          <h1 className="text-3xl font-semibold text-[color:var(--foreground)]">
            Companies
          </h1>
          <p className="text-sm text-[color:var(--muted)]">
            {companies.length} total
          </p>
        </header>

        <section className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-xl border-b border-[color:var(--border)] bg-[color:var(--panel-header)] px-4 py-2">
            <h2 className="text-sm font-semibold text-[color:var(--foreground)]">
              Companies
            </h2>
            <CompanyCreateModal />
          </div>
          <div className="p-6">
            {companySummaries.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)]">
                No companies yet.
              </p>
            ) : (
              <CompanyListPanel companies={companySummaries} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
