import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  company,
  interactionPerson,
  interactionRole,
  interactionTypePerson,
  interactionTypeRole,
  person,
  role,
} from "@/db/schema";
import CompanyEditModal from "@/app/components/CompanyEditModal";
import CompanyDeleteButton from "@/app/components/CompanyDeleteButton";
import CompanyPeopleList from "@/app/components/CompanyPeopleList";
import CompanyInteractionList from "@/app/components/CompanyInteractionList";
import CompanyNotesEditor from "@/app/components/CompanyNotesEditor";
import { formatPersonName } from "@/lib/personName";
import { getRoleStatusFromInteractionType } from "@/lib/roleStatus";
import { getStatusTone, STATUS_TONE_STYLES } from "@/lib/statusTone";
import GlobalNavLinks from "@/app/components/GlobalNavLinks";
import BreadcrumbNav from "@/app/components/BreadcrumbNav";

export const dynamic = "force-dynamic";

type CompanyPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { id } = await params;
  const companyId = Number(id);
  if (!Number.isInteger(companyId)) {
    notFound();
  }

  const companyRow = db
    .select({
      id: company.id,
      name: company.name,
      url: company.url,
      linkedin: company.linkedin,
      notes: company.notes,
    })
    .from(company)
    .where(eq(company.id, companyId))
    .get();

  if (!companyRow) {
    notFound();
  }

  const roleCount = db
    .select({ count: sql<number>`count(${role.id})`.as("count") })
    .from(role)
    .where(eq(role.companyId, companyId))
    .get();

  const personCount = db
    .select({ count: sql<number>`count(${person.id})`.as("count") })
    .from(person)
    .where(eq(person.companyId, companyId))
    .get();

  const roles = db
    .select({
      id: role.id,
      title: role.title,
      createdAt: role.createdAt,
    })
    .from(role)
    .where(eq(role.companyId, companyId))
    .all();

  const roleIds = roles.map((entry) => entry.id);
  const roleInteractionRows =
    roleIds.length > 0
      ? db
          .select({
            id: interactionRole.id,
            roleId: interactionRole.roleId,
            occurredAt: interactionRole.occurredAt,
            interactionTypeName: interactionTypeRole.name,
          })
          .from(interactionRole)
          .innerJoin(
            interactionTypeRole,
            eq(interactionRole.interactionTypeId, interactionTypeRole.id)
          )
          .where(inArray(interactionRole.roleId, roleIds))
          .orderBy(desc(interactionRole.occurredAt), desc(interactionRole.id))
          .all()
      : [];

  const lastInteractionByRole = new Map<number, { id: number; occurredAt: number }>();
  const lastInteractionTypeByRole = new Map<number, string>();
  const statusByRoleId = new Map<number, string>();
  for (const entry of roleInteractionRows) {
    if (!lastInteractionByRole.has(entry.roleId)) {
      const occurredAt =
        entry.occurredAt instanceof Date
          ? entry.occurredAt.getTime()
          : Number(entry.occurredAt);
      lastInteractionByRole.set(entry.roleId, {
        id: Number(entry.id),
        occurredAt,
      });
      lastInteractionTypeByRole.set(entry.roleId, entry.interactionTypeName);
    }
    if (!statusByRoleId.has(entry.roleId)) {
      const status = getRoleStatusFromInteractionType(entry.interactionTypeName);
      if (status) {
        statusByRoleId.set(entry.roleId, status);
      }
    }
  }

  const rolesSorted = [...roles].sort((a, b) => {
    const aKey =
      lastInteractionByRole.get(a.id)?.occurredAt ??
      (a.createdAt instanceof Date ? a.createdAt.getTime() : Number(a.createdAt));
    const bKey =
      lastInteractionByRole.get(b.id)?.occurredAt ??
      (b.createdAt instanceof Date ? b.createdAt.getTime() : Number(b.createdAt));
    if (aKey === bKey) {
      const aInteractionId = lastInteractionByRole.get(a.id)?.id ?? null;
      const bInteractionId = lastInteractionByRole.get(b.id)?.id ?? null;
      if (
        aInteractionId !== null &&
        bInteractionId !== null &&
        aInteractionId !== bInteractionId
      ) {
        return bInteractionId - aInteractionId;
      }
      return a.title.localeCompare(b.title);
    }
    return bKey - aKey;
  });

  const people = db
    .select({
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      title: person.title,
      email: person.email,
      linkedin: person.linkedin,
      phone: person.phone,
    })
    .from(person)
    .where(eq(person.companyId, companyId))
    .orderBy(asc(person.firstName), asc(person.lastName), asc(person.id))
    .all();

  const peopleForInteractions = db
    .select({
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      companyId: person.companyId,
    })
    .from(person)
    .where(eq(person.companyId, companyId))
    .orderBy(asc(person.firstName), asc(person.lastName), asc(person.id))
    .all()
    .map((entry) => ({
      ...entry,
      companyName: companyRow.name,
    }));

  const roleInteractionTypes = db
    .select({ id: interactionTypeRole.id, name: interactionTypeRole.name })
    .from(interactionTypeRole)
    .orderBy(asc(interactionTypeRole.id))
    .all();

  const personInteractionTypes = db
    .select({ id: interactionTypePerson.id, name: interactionTypePerson.name })
    .from(interactionTypePerson)
    .orderBy(asc(interactionTypePerson.id))
    .all();

  const personInteractions = db
    .select({
      id: interactionPerson.id,
      occurredAt: interactionPerson.occurredAt,
      interactionTypeId: interactionPerson.interactionTypeId,
      interactionTypeName: interactionTypePerson.name,
      notes: interactionPerson.notes,
      personId: person.id,
      personFirstName: person.firstName,
      personLastName: person.lastName,
    })
    .from(interactionPerson)
    .innerJoin(
      interactionTypePerson,
      eq(interactionPerson.interactionTypeId, interactionTypePerson.id)
    )
    .innerJoin(person, eq(interactionPerson.personId, person.id))
    .where(eq(person.companyId, companyId))
    .orderBy(desc(interactionPerson.occurredAt), desc(interactionPerson.id))
    .all()
    .map((entry) => ({
      ...entry,
      occurredAt:
        entry.occurredAt instanceof Date
          ? entry.occurredAt.getTime()
          : Number(entry.occurredAt),
      personName: formatPersonName(entry.personFirstName, entry.personLastName),
      source: "person" as const,
    }));

  const roleInteractions =
    roleIds.length > 0
      ? db
          .select({
            id: interactionRole.id,
            occurredAt: interactionRole.occurredAt,
            interactionTypeId: interactionRole.interactionTypeId,
            interactionTypeName: interactionTypeRole.name,
            notes: interactionRole.notes,
            roleId: role.id,
            roleTitle: role.title,
            personId: person.id,
            personFirstName: person.firstName,
            personLastName: person.lastName,
          })
          .from(interactionRole)
          .innerJoin(role, eq(interactionRole.roleId, role.id))
          .innerJoin(
            interactionTypeRole,
            eq(interactionRole.interactionTypeId, interactionTypeRole.id)
          )
          .leftJoin(person, eq(interactionRole.personId, person.id))
          .where(inArray(interactionRole.roleId, roleIds))
          .orderBy(desc(interactionRole.occurredAt), desc(interactionRole.id))
          .all()
          .map((entry) => ({
            ...entry,
            occurredAt:
              entry.occurredAt instanceof Date
                ? entry.occurredAt.getTime()
                : Number(entry.occurredAt),
            personName: formatPersonName(
              entry.personFirstName,
              entry.personLastName
            ) || null,
            source: "role" as const,
          }))
      : [];

  const interactions = [...roleInteractions, ...personInteractions].sort(
    (a, b) => {
      if (a.occurredAt === b.occurredAt) {
        return b.id - a.id;
      }
      return b.occurredAt - a.occurredAt;
    }
  );

  function formatDateTime(value: number | Date) {
    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <main className="box-border px-6 pt-12 pb-10">
      <div className="fixed inset-x-0 top-0 z-30">
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex h-12 items-center justify-between rounded-b-lg border border-t-0 border-[color:var(--border)] bg-[color:var(--card)] px-6">
            <BreadcrumbNav
              items={[
                { label: "Companies", href: "/companies" },
                { label: companyRow.name },
              ]}
            />
            <GlobalNavLinks />
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 pt-6">
        <header className="flex flex-wrap items-start justify-between gap-6 px-2">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-[color:var(--foreground)]">
              {companyRow.name}
            </h1>
            <div className="space-y-1 text-sm text-[color:var(--muted)]">
              <div>
                <span className="uppercase tracking-wide text-xs text-[color:var(--muted)]">
                  Website:
                </span>{" "}
                {companyRow.url ? (
                  <a
                    href={
                      companyRow.url.startsWith("http")
                        ? companyRow.url
                        : `https://${companyRow.url}`
                    }
                    className="text-[color:var(--foreground)] underline underline-offset-4"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {companyRow.url.startsWith("http")
                      ? companyRow.url
                      : `https://${companyRow.url}`}
                  </a>
                ) : (
                  <span className="text-[color:var(--foreground)]">N/A</span>
                )}
              </div>
              <div>
                <span className="uppercase tracking-wide text-xs text-[color:var(--muted)]">
                  LinkedIn:
                </span>{" "}
                {companyRow.linkedin ? (
                  <a
                    href={
                      companyRow.linkedin.startsWith("http")
                        ? companyRow.linkedin
                        : `https://${companyRow.linkedin}`
                    }
                    className="text-[color:var(--foreground)] underline underline-offset-4"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {companyRow.linkedin.startsWith("http")
                      ? companyRow.linkedin
                      : `https://${companyRow.linkedin}`}
                  </a>
                ) : (
                  <span className="text-[color:var(--foreground)]">N/A</span>
                )}
              </div>
              <div>
                <span className="uppercase tracking-wide text-xs text-[color:var(--muted)]">
                  Roles:
                </span>{" "}
                <span className="text-[color:var(--foreground)]">
                  {Number(roleCount?.count ?? 0)}
                </span>
              </div>
              <div>
                <span className="uppercase tracking-wide text-xs text-[color:var(--muted)]">
                  People:
                </span>{" "}
                <span className="text-[color:var(--foreground)]">
                  {Number(personCount?.count ?? 0)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <CompanyEditModal
                companyId={companyRow.id}
                initialName={companyRow.name}
                initialUrl={companyRow.url}
                initialLinkedin={companyRow.linkedin}
              />
              <CompanyDeleteButton
                companyId={companyRow.id}
                companyName={companyRow.name}
              />
            </div>
          </div>
        </header>

        <section className="space-y-6">
          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] overflow-hidden">
            <div className="flex items-center justify-between rounded-t-xl border-b border-[color:var(--border)] bg-[color:var(--panel-header)] px-4 py-2">
              <div className="group relative" aria-describedby="company-roles-sort-tooltip">
                <h2 className="text-sm font-semibold text-[color:var(--foreground)]">
                  Roles ({rolesSorted.length})
                </h2>
                <div
                  id="company-roles-sort-tooltip"
                  role="tooltip"
                  className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-72 translate-y-1 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-xs text-[color:var(--foreground)] opacity-0 shadow-lg transition duration-150 group-hover:translate-y-0 group-hover:opacity-100"
                >
                  Roles are sorted in descneding order of last interacton.
                </div>
              </div>
            </div>
            <div className="p-6">
              {rolesSorted.length === 0 ? (
                <p className="text-sm text-[color:var(--muted)]">
                  No roles linked to this company yet.
                </p>
              ) : (
                <div className="grid gap-4">
                  {rolesSorted.map((roleEntry) => {
                    const tone = getStatusTone(
                      statusByRoleId.get(roleEntry.id) ?? "Open"
                    );
                    const edgeStyle = STATUS_TONE_STYLES[tone].edge;
                    return (
                      <Link
                        key={roleEntry.id}
                        href={`/roles/${roleEntry.id}`}
                        className="relative rounded-xl border border-[color:var(--border)] bg-black/5 p-5 transition-colors hover:border-[color:var(--accent)] dark:bg-white/5 overflow-hidden"
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none absolute bottom-0 right-0 h-2 w-28 rounded-tl-lg bg-gradient-to-l ${edgeStyle}`}
                        />
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="space-y-1 self-center">
                            <p className="text-base font-semibold text-[color:var(--foreground)]">
                              {roleEntry.title}
                            </p>
                          </div>
                          <div className="text-right text-xs text-[color:var(--muted)]">
                            <div className="text-[color:var(--foreground)]">
                              {lastInteractionTypeByRole.get(roleEntry.id) &&
                              lastInteractionByRole.has(roleEntry.id) ? (
                                <>
                                  <span className="text-sm font-semibold text-[color:var(--foreground)]">
                                    {lastInteractionTypeByRole.get(roleEntry.id)}
                                  </span>{" "}
                                  <span className="text-[color:var(--muted)]">
                                    on{" "}
                                    {formatDateTime(
                                      lastInteractionByRole.get(roleEntry.id)?.occurredAt as number
                                    )}
                                  </span>
                                </>
                              ) : (
                                "No interactions"
                              )}
                            </div>
                            <div>Created: {formatDateTime(roleEntry.createdAt)}</div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <CompanyPeopleList people={people} />

          <CompanyInteractionList
            company={{ id: companyRow.id, name: companyRow.name }}
            people={peopleForInteractions}
            roleInteractionTypes={roleInteractionTypes}
            personInteractionTypes={personInteractionTypes}
            interactions={interactions}
          />

          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] overflow-hidden">
            <div className="flex items-center justify-between rounded-t-xl border-b border-[color:var(--border)] bg-[color:var(--panel-header)] px-4 py-2">
              <h2 className="text-sm font-semibold text-[color:var(--foreground)]">
                Notes
              </h2>
            </div>
            <div className="p-6">
              <CompanyNotesEditor
                companyId={companyRow.id}
                initialNotes={companyRow.notes ?? null}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
