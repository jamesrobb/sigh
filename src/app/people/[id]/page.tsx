import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  company,
  interactionPerson,
  interactionRole,
  interactionTypePerson,
  interactionTypeRole,
  person,
  personTag,
  role,
  tag,
} from "@/db/schema";
import PersonEditModal from "@/app/components/PersonEditModal";
import PersonDeleteButton from "@/app/components/PersonDeleteButton";
import PersonInteractionList from "@/app/components/PersonInteractionList";
import PersonNotesEditor from "@/app/components/PersonNotesEditor";
import TagManager from "@/app/components/TagManager";
import { formatPersonName } from "@/lib/personName";
import { getRoleStatusFromInteractionType } from "@/lib/roleStatus";
import { getStatusTone, STATUS_TONE_STYLES } from "@/lib/statusTone";
import GlobalNavLinks from "@/app/components/GlobalNavLinks";
import BreadcrumbNav from "@/app/components/BreadcrumbNav";

export const dynamic = "force-dynamic";

type PersonPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PersonPage({ params }: PersonPageProps) {
  const { id } = await params;
  const personId = Number(id);
  if (!Number.isInteger(personId)) {
    notFound();
  }

  const personRow = db
    .select({
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      title: person.title,
      email: person.email,
      phone: person.phone,
      linkedin: person.linkedin,
      notes: person.notes,
      companyId: company.id,
      companyName: company.name,
    })
    .from(person)
    .innerJoin(company, eq(person.companyId, company.id))
    .where(eq(person.id, personId))
    .get();

  if (!personRow) {
    notFound();
  }

  const personName = formatPersonName(personRow.firstName, personRow.lastName);

  const companies = db
    .select({ id: company.id, name: company.name })
    .from(company)
    .orderBy(asc(company.id))
    .all();

  const personInteractionTypes = db
    .select({ id: interactionTypePerson.id, name: interactionTypePerson.name })
    .from(interactionTypePerson)
    .orderBy(asc(interactionTypePerson.id))
    .all();

  const roleInteractionTypes = db
    .select({ id: interactionTypeRole.id, name: interactionTypeRole.name })
    .from(interactionTypeRole)
    .orderBy(asc(interactionTypeRole.id))
    .all();

  const personInteractions = db
    .select({
      id: interactionPerson.id,
      occurredAt: interactionPerson.occurredAt,
      interactionTypeId: interactionPerson.interactionTypeId,
      interactionTypeName: interactionTypePerson.name,
      notes: interactionPerson.notes,
    })
    .from(interactionPerson)
    .innerJoin(
      interactionTypePerson,
      eq(interactionPerson.interactionTypeId, interactionTypePerson.id)
    )
    .where(eq(interactionPerson.personId, personId))
    .orderBy(desc(interactionPerson.occurredAt), desc(interactionPerson.id))
    .all()
    .map((entry) => ({
      ...entry,
      occurredAt:
        entry.occurredAt instanceof Date
          ? entry.occurredAt.getTime()
          : Number(entry.occurredAt),
    }));

  const roleInteractions = db
    .select({
      id: interactionRole.id,
      occurredAt: interactionRole.occurredAt,
      interactionTypeId: interactionRole.interactionTypeId,
      interactionTypeName: interactionTypeRole.name,
      notes: interactionRole.notes,
      roleId: role.id,
      roleTitle: role.title,
      companyId: company.id,
      companyName: company.name,
    })
    .from(interactionRole)
    .innerJoin(
      interactionTypeRole,
      eq(interactionRole.interactionTypeId, interactionTypeRole.id)
    )
    .innerJoin(role, eq(interactionRole.roleId, role.id))
    .innerJoin(company, eq(role.companyId, company.id))
    .where(eq(interactionRole.personId, personId))
    .orderBy(desc(interactionRole.occurredAt), desc(interactionRole.id))
    .all()
    .map((entry) => ({
      ...entry,
      occurredAt:
        entry.occurredAt instanceof Date
          ? entry.occurredAt.getTime()
          : Number(entry.occurredAt),
    }));

  const allTags = db
    .select({ id: tag.id, name: tag.name })
    .from(tag)
    .orderBy(asc(tag.name))
    .all();

  const personTags = db
    .select({ id: tag.id, name: tag.name })
    .from(personTag)
    .innerJoin(tag, eq(personTag.tagId, tag.id))
    .where(eq(personTag.personId, personId))
    .orderBy(asc(tag.name))
    .all();

  const associatedRoleRows = db
    .select({
      id: role.id,
      title: role.title,
      createdAt: role.createdAt,
      companyId: company.id,
      companyName: company.name,
    })
    .from(interactionRole)
    .innerJoin(role, eq(interactionRole.roleId, role.id))
    .innerJoin(company, eq(role.companyId, company.id))
    .where(eq(interactionRole.personId, personId))
    .orderBy(desc(role.createdAt))
    .all();

  const roleById = new Map<number, typeof associatedRoleRows[number]>();
  for (const entry of associatedRoleRows) {
    if (!roleById.has(entry.id)) {
      roleById.set(entry.id, entry);
    }
  }
  const associatedRoles = Array.from(roleById.values());

  const roleIds = associatedRoles.map((entry) => entry.id);
  const roleStatusRows =
    roleIds.length > 0
      ? db
          .select({
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

  const lastInteractionByRole = new Map<number, number>();
  const lastInteractionTypeByRole = new Map<number, string>();
  const statusByRoleId = new Map<number, string>();
  for (const entry of roleStatusRows) {
    if (!lastInteractionByRole.has(entry.roleId)) {
      const occurredAt =
        entry.occurredAt instanceof Date
          ? entry.occurredAt.getTime()
          : Number(entry.occurredAt);
      lastInteractionByRole.set(entry.roleId, occurredAt);
      lastInteractionTypeByRole.set(entry.roleId, entry.interactionTypeName);
    }
    if (!statusByRoleId.has(entry.roleId)) {
      const status = getRoleStatusFromInteractionType(entry.interactionTypeName);
      if (status) {
        statusByRoleId.set(entry.roleId, status);
      }
    }
  }

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
                { label: "People", href: "/people" },
                { label: personName },
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
              {personName}
            </h1>
            <div className="space-y-1 text-sm text-[color:var(--muted)]">
              <div>
                <span className="uppercase tracking-wide text-xs text-[color:var(--muted)]">
                  Company:
                </span>{" "}
                <Link
                  href={`/companies/${personRow.companyId}`}
                  className="text-[color:var(--foreground)] underline underline-offset-4"
                >
                  {personRow.companyName}
                </Link>
              </div>
              <div>
                <span className="uppercase tracking-wide text-xs text-[color:var(--muted)]">
                  Title:
                </span>{" "}
                <span className="text-[color:var(--foreground)]">
                  {personRow.title ?? "N/A"}
                </span>
              </div>
              <div>
                <span className="uppercase tracking-wide text-xs text-[color:var(--muted)]">
                  Email:
                </span>{" "}
                {personRow.email ? (
                  <a
                    href={`mailto:${personRow.email}`}
                    className="text-[color:var(--foreground)] underline underline-offset-4"
                  >
                    {personRow.email}
                  </a>
                ) : (
                  <span className="text-[color:var(--foreground)]">N/A</span>
                )}
              </div>
              <div>
                <span className="uppercase tracking-wide text-xs text-[color:var(--muted)]">
                  Phone:
                </span>{" "}
                <span className="text-[color:var(--foreground)]">
                  {personRow.phone ?? "N/A"}
                </span>
              </div>
              <div>
                <span className="uppercase tracking-wide text-xs text-[color:var(--muted)]">
                  LinkedIn:
                </span>{" "}
                {personRow.linkedin ? (
                  <a
                    href={
                      personRow.linkedin.startsWith("http")
                        ? personRow.linkedin
                        : `https://${personRow.linkedin}`
                    }
                    className="text-[color:var(--foreground)] underline underline-offset-4"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {personRow.linkedin.startsWith("http")
                      ? personRow.linkedin
                      : `https://${personRow.linkedin}`}
                  </a>
                ) : (
                  <span className="text-[color:var(--foreground)]">N/A</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <PersonEditModal
                personId={personId}
                initialFirstName={personRow.firstName}
                initialLastName={personRow.lastName}
                initialCompanyId={personRow.companyId}
                initialCompanyName={personRow.companyName}
                initialTitle={personRow.title}
                initialEmail={personRow.email}
                initialLinkedin={personRow.linkedin}
                initialPhone={personRow.phone}
                companies={companies}
              />
              <PersonDeleteButton personId={personId} personName={personName} />
            </div>
          </div>
        </header>

        <section className="space-y-6">
          <PersonInteractionList
            person={{
              id: personRow.id,
              firstName: personRow.firstName,
              lastName: personRow.lastName,
              companyId: personRow.companyId,
              companyName: personRow.companyName,
            }}
            personInteractionTypes={personInteractionTypes}
            roleInteractionTypes={roleInteractionTypes}
            personInteractions={personInteractions}
            roleInteractions={roleInteractions}
          />

          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] overflow-visible">
            <div className="flex items-center justify-between rounded-t-xl border-b border-[color:var(--border)] bg-[color:var(--panel-header)] px-4 py-2">
              <h2 className="text-sm font-semibold text-[color:var(--foreground)]">
                Tags
              </h2>
            </div>
            <div className="p-6">
              <TagManager
                subjectId={personId}
                linkEndpoint={`/api/people/${personId}/tags`}
                assignedTags={personTags}
                allTags={allTags}
              />
            </div>
          </div>

          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] overflow-hidden">
            <div className="flex items-center justify-between rounded-t-xl border-b border-[color:var(--border)] bg-[color:var(--panel-header)] px-4 py-2">
              <div className="group relative" aria-describedby="person-roles-sort-tooltip">
                <h2 className="text-sm font-semibold text-[color:var(--foreground)]">
                  Roles ({associatedRoles.length})
                </h2>
                <div
                  id="person-roles-sort-tooltip"
                  role="tooltip"
                  className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-72 translate-y-1 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-xs text-[color:var(--foreground)] opacity-0 shadow-lg transition duration-150 group-hover:translate-y-0 group-hover:opacity-100"
                >
                  Roles are sorted in descneding order of last interacton.
                </div>
              </div>
            </div>
            <div className="p-6">
              {associatedRoles.length === 0 ? (
                <p className="text-sm text-[color:var(--muted)]">
                  No roles linked to this person yet.
                </p>
              ) : (
                <div className="grid gap-4">
                  {associatedRoles.map((roleEntry) => {
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
                          <div className="space-y-1">
                            <p className="text-base font-semibold text-[color:var(--foreground)]">
                              {roleEntry.title}
                            </p>
                            <p className="text-sm text-[color:var(--muted)]">
                              {roleEntry.companyName}
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
                                      lastInteractionByRole.get(roleEntry.id) as number
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

          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] overflow-hidden">
            <div className="flex items-center justify-between rounded-t-xl border-b border-[color:var(--border)] bg-[color:var(--panel-header)] px-4 py-2">
              <h2 className="text-sm font-semibold text-[color:var(--foreground)]">
                Notes
              </h2>
            </div>
            <div className="p-6">
              <PersonNotesEditor
                personId={personRow.id}
                initialNotes={personRow.notes ?? null}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
