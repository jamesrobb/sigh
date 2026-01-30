import Link from "next/link";
import Linkify from "linkify-react";
import { notFound } from "next/navigation";
import { asc, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  company,
  currency,
  hunt,
  interactionRole,
  interactionTypeRole,
  person,
  roleTag,
  role,
  tag,
} from "@/db/schema";
import InteractionList from "@/app/components/InteractionList";
import RoleNotesEditor from "@/app/components/RoleNotesEditor";
import RoleEditModal from "@/app/components/RoleEditModal";
import RoleDeleteButton from "@/app/components/RoleDeleteButton";
import TagManager from "@/app/components/TagManager";
import RoleDescriptionDocumentUpload from "@/app/components/RoleDescriptionDocumentUpload";
import RoleDescriptionDocumentDeleteButton from "@/app/components/RoleDescriptionDocumentDeleteButton";
import { formatPersonName } from "@/lib/personName";
import GlobalNavLinks from "@/app/components/GlobalNavLinks";
import BreadcrumbNav from "@/app/components/BreadcrumbNav";
import { deriveRoleStatus } from "@/lib/roleStatus";
import { getStatusTone, STATUS_TONE_STYLES } from "@/lib/statusTone";

export const dynamic = "force-dynamic";

type RolePageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value: number | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSalary(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "N/A";
  }
  return String(Math.trunc(value)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export default async function RolePage({ params }: RolePageProps) {
  const { id } = await params;
  const roleId = Number(id);
  if (!Number.isInteger(roleId)) {
    notFound();
  }

  const roleRow = db
    .select({
      id: role.id,
      title: role.title,
      createdAt: role.createdAt,
      description: role.description,
      descriptionDocumentPath: role.descriptionDocumentPath,
      descriptionDocumentName: role.descriptionDocumentName,
      notes: role.notes,
      salaryLowerEnd: role.salaryLowerEnd,
      salaryHigherEnd: role.salaryHigherEnd,
      currencyId: role.currencyId,
      currencyCode: currency.code,
      companyId: role.companyId,
      companyName: company.name,
      companyUrl: company.url,
      huntId: hunt.id,
      huntName: hunt.name,
    })
    .from(role)
    .innerJoin(company, eq(role.companyId, company.id))
    .innerJoin(hunt, eq(role.huntId, hunt.id))
    .leftJoin(currency, eq(role.currencyId, currency.id))
    .where(eq(role.id, roleId))
    .get();

  if (!roleRow) {
    notFound();
  }

  const interactionPeople = db
    .select({
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      title: person.title,
      email: person.email,
      phone: person.phone,
      linkedin: person.linkedin,
      companyId: company.id,
      companyName: company.name,
      companyUrl: company.url,
    })
    .from(interactionRole)
    .innerJoin(person, eq(interactionRole.personId, person.id))
    .innerJoin(company, eq(person.companyId, company.id))
    .where(eq(interactionRole.roleId, roleId))
    .orderBy(asc(person.firstName), asc(person.lastName), asc(person.id))
    .all();

  const peopleById = new Map<number, typeof interactionPeople[number]>();
  for (const entry of interactionPeople) {
    if (!peopleById.has(entry.id)) {
      peopleById.set(entry.id, entry);
    }
  }

  const orderedPeople = Array.from(peopleById.values()).sort((a, b) => {
    const aMatch = a.companyId === roleRow.companyId;
    const bMatch = b.companyId === roleRow.companyId;
    if (aMatch !== bMatch) {
      return aMatch ? -1 : 1;
    }
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

  const companyPeople = db
    .select({
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      companyId: person.companyId,
      companyName: company.name,
    })
    .from(person)
    .innerJoin(company, eq(person.companyId, company.id))
    .where(eq(person.companyId, roleRow.companyId))
    .orderBy(asc(person.firstName), asc(person.lastName), asc(person.id))
    .all();

  const otherPeople = db
    .select({
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      companyId: person.companyId,
      companyName: company.name,
    })
    .from(person)
    .innerJoin(company, eq(person.companyId, company.id))
    .where(ne(person.companyId, roleRow.companyId))
    .orderBy(
      asc(company.name),
      asc(person.firstName),
      asc(person.lastName),
      asc(person.id)
    )
    .all();

  const peopleOptions = [...companyPeople, ...otherPeople];

  const interactionTypes = db
    .select({ id: interactionTypeRole.id, name: interactionTypeRole.name })
    .from(interactionTypeRole)
    .orderBy(asc(interactionTypeRole.id))
    .all();

  const companies = db
    .select({ id: company.id, name: company.name })
    .from(company)
    .orderBy(asc(company.id))
    .all();

  const interactions = db
    .select({
      id: interactionRole.id,
      occurredAt: interactionRole.occurredAt,
      interactionTypeId: interactionRole.interactionTypeId,
      interactionTypeName: interactionTypeRole.name,
      personId: person.id,
      personFirstName: person.firstName,
      personLastName: person.lastName,
      notes: interactionRole.notes,
    })
    .from(interactionRole)
    .innerJoin(
      interactionTypeRole,
      eq(interactionRole.interactionTypeId, interactionTypeRole.id)
    )
    .leftJoin(person, eq(interactionRole.personId, person.id))
    .where(eq(interactionRole.roleId, roleId))
    .orderBy(desc(interactionRole.occurredAt), desc(interactionRole.id))
    .all()
    .map((entry) => ({
      ...entry,
      occurredAt:
        entry.occurredAt instanceof Date
          ? entry.occurredAt.getTime()
          : Number(entry.occurredAt),
      personName: formatPersonName(entry.personFirstName, entry.personLastName) || null,
    }));

  const allTags = db
    .select({ id: tag.id, name: tag.name })
    .from(tag)
    .orderBy(asc(tag.name))
    .all();

  const roleTags = db
    .select({ id: tag.id, name: tag.name })
    .from(roleTag)
    .innerJoin(tag, eq(roleTag.tagId, tag.id))
    .where(eq(roleTag.roleId, roleId))
    .orderBy(asc(tag.name))
    .all();

  const lastInteractionLabel = interactions[0]?.interactionTypeName ?? "N/A";
  const roleStatus = deriveRoleStatus(
    interactions.map((entry) => entry.interactionTypeName)
  );
  const statusTone = getStatusTone(roleStatus);
  const statusStyles = STATUS_TONE_STYLES[statusTone];
  const descriptionDocumentName =
    roleRow.descriptionDocumentName ?? roleRow.descriptionDocumentPath;

  return (
    <main className="box-border px-6 pt-12 pb-10">
      <div className="fixed inset-x-0 top-0 z-30">
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex h-12 items-center justify-between rounded-b-lg border border-t-0 border-[color:var(--border)] bg-[color:var(--card)] px-6">
            <BreadcrumbNav
              items={[
                { label: "Hunts", href: "/" },
                { label: roleRow.huntName, href: `/hunts/${roleRow.huntId}` },
                { label: roleRow.title },
              ]}
            />
            <GlobalNavLinks />
          </div>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 pt-6">

        <header className="flex flex-col gap-6 px-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold text-[color:var(--foreground)]">
                {roleRow.title}
              </h1>
            </div>
          <div className="space-y-1 text-sm text-[color:var(--muted)]">
            <div>
              <span className="uppercase tracking-wide text-xs text-[color:var(--muted)]">
                Company:
              </span>{" "}
              <Link
                href={`/companies/${roleRow.companyId}`}
                className="text-[color:var(--foreground)] underline underline-offset-4"
              >
                {roleRow.companyName}
              </Link>
            </div>
            <div>
              <span className="uppercase tracking-wide text-xs text-[color:var(--muted)]">
                Salary lower end:
              </span>{" "}
              <span className="text-[color:var(--foreground)]">
                {roleRow.salaryLowerEnd !== null
                  ? `${formatSalary(roleRow.salaryLowerEnd)} ${
                      roleRow.currencyCode ?? ""
                    }`.trim()
                  : "N/A"}
              </span>
            </div>
            <div>
              <span className="uppercase tracking-wide text-xs text-[color:var(--muted)]">
                Salary higher end:
              </span>{" "}
              <span className="text-[color:var(--foreground)]">
                {roleRow.salaryHigherEnd !== null
                  ? `${formatSalary(roleRow.salaryHigherEnd)} ${
                      roleRow.currencyCode ?? ""
                    }`.trim()
                  : "N/A"}
              </span>
            </div>
            <div>
              <span className="uppercase tracking-wide text-xs text-[color:var(--muted)]">
                Created at:
              </span>{" "}
                <span className="text-[color:var(--foreground)]">
                  {formatDate(roleRow.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex w-full max-w-xs flex-col gap-4 lg:items-end lg:self-center">
            <div className="flex flex-col gap-2 lg:items-end">
              <p className="text-xs uppercase tracking-wide text-[color:var(--muted)]">
                Status
              </p>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-base font-semibold ${statusStyles.cellBase} ${statusStyles.text}`}
              >
                {roleStatus}
              </span>
            </div>
            <div className="flex w-full justify-end gap-2 pt-1">
              <RoleEditModal
                roleId={roleId}
                initialTitle={roleRow.title}
                initialCompanyId={roleRow.companyId}
                initialCompanyName={roleRow.companyName}
                initialDescription={roleRow.description}
                initialSalaryLowerEnd={roleRow.salaryLowerEnd}
                initialSalaryHigherEnd={roleRow.salaryHigherEnd}
                initialCurrencyId={roleRow.currencyId}
                initialCurrencyCode={roleRow.currencyCode}
                companies={companies}
              />
              <RoleDeleteButton
                roleId={roleId}
                roleTitle={roleRow.title}
                huntId={roleRow.huntId}
              />
            </div>
          </div>
        </header>

        <section className="space-y-6">
          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] overflow-visible">
            <div className="flex items-center justify-between rounded-t-xl border-b border-[color:var(--border)] bg-[color:var(--panel-header)] px-4 py-2">
              <h2 className="text-sm font-semibold text-[color:var(--foreground)]">
                Tags
              </h2>
            </div>
            <div className="p-6">
              <TagManager
                subjectId={roleId}
                linkEndpoint={`/api/roles/${roleId}/tags`}
                assignedTags={roleTags}
                allTags={allTags}
              />
            </div>
          </div>

          <InteractionList
            roleId={roleId}
            companyId={roleRow.companyId}
            companyName={roleRow.companyName}
            interactionTypes={interactionTypes}
            people={peopleOptions}
            interactions={interactions}
          />

          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] text-sm overflow-hidden">
            <div className="flex items-center justify-between rounded-t-xl border-b border-[color:var(--border)] bg-[color:var(--panel-header)] px-4 py-2">
              <div
                className="group relative inline-flex items-center outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--panel-header)]"
                tabIndex={0}
                aria-describedby="people-tooltip"
              >
                <h2 className="text-sm font-semibold text-[color:var(--foreground)]">
                  People
                </h2>
                <div
                  id="people-tooltip"
                  role="tooltip"
                  className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-72 translate-y-1 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-xs text-[color:var(--foreground)] opacity-0 shadow-lg transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
                >
                  People are associated with roles via interactions. Add or
                  remove interactions to change who is listed here.
                </div>
              </div>
            </div>
            <div className="space-y-4 p-6">
              {orderedPeople.length === 0 ? (
                <p className="text-[color:var(--muted)]">
                  No people linked to this role.
                </p>
              ) : (
                <div className="space-y-3">
                  {orderedPeople.map((entry) => (
                    <div
                      key={entry.id}
                      className="group relative cursor-pointer rounded-lg border border-[color:var(--border)] bg-black/5 p-4 text-sm text-[color:var(--foreground)] transition-colors hover:border-[color:var(--accent)] dark:bg-white/5"
                    >
                      <Link
                        href={`/people/${entry.id}`}
                        className="absolute inset-0 z-0 rounded-lg"
                        aria-label={`View ${formatPersonName(
                          entry.firstName,
                          entry.lastName
                        )}`}
                      >
                        <span className="sr-only">
                          View {formatPersonName(entry.firstName, entry.lastName)}
                        </span>
                      </Link>
                      <div className="relative z-10 flex items-start gap-3 pointer-events-none">
                        <div className="flex-none self-center flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--panel-header)] text-[color:var(--accent)]">
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
                        <div className="space-y-2">
                          <p className="text-base font-semibold text-[color:var(--foreground)] transition-colors group-hover:text-[color:var(--accent)]">
                            {formatPersonName(entry.firstName, entry.lastName)}
                            {entry.title ? (
                              <span className="text-[color:var(--muted)]">
                                {" "}
                                ({entry.title})
                              </span>
                            ) : null}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[color:var(--muted)]">
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
                                  <rect x="4" y="3" width="16" height="18" rx="2" />
                                  <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" />
                                  <path d="M9 21v-4h6v4" />
                                </svg>
                              </span>
                              <Link
                                href={`/companies/${entry.companyId}`}
                                className="pointer-events-auto underline underline-offset-4"
                              >
                                {entry.companyName}
                              </Link>
                            </span>
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
                                  className="pointer-events-auto underline underline-offset-4"
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
                                  className="pointer-events-auto underline underline-offset-4"
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
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] text-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-xl border-b border-[color:var(--border)] bg-[color:var(--panel-header)] px-4 py-2">
              <h2 className="text-sm font-semibold text-[color:var(--foreground)]">
                Description
              </h2>
              <RoleDescriptionDocumentUpload roleId={roleId} />
            </div>
            <div className="space-y-4 p-6">
              {roleRow.descriptionDocumentPath ? (
                <div className="group relative flex items-center justify-between gap-3 rounded-lg border border-[color:var(--border)] bg-black/5 p-3 text-[color:var(--foreground)] transition-colors hover:border-[color:var(--accent)] dark:bg-white/5">
                  <a
                    href={`/api/attachments/${encodeURIComponent(
                      roleRow.descriptionDocumentPath
                    )}`}
                    className="absolute inset-0 rounded-lg"
                    aria-label="Open description document"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                  <div className="pointer-events-none flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md border border-[color:var(--border)] bg-[color:var(--panel-header)] text-[color:var(--accent)]">
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
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                        <path d="M16 13H8" />
                        <path d="M16 17H8" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[color:var(--foreground)]">
                        Description document
                      </p>
                      <p className="truncate text-xs text-[color:var(--muted)]">
                        {descriptionDocumentName}
                      </p>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <RoleDescriptionDocumentDeleteButton
                      roleId={roleId}
                      documentName={descriptionDocumentName}
                    />
                  </div>
                </div>
              ) : null}
              {roleRow.description?.trim() ? (
                <p className="whitespace-pre-wrap text-[color:var(--foreground)]">
                  <Linkify
                    options={{
                      defaultProtocol: "https",
                      target: "_blank",
                      rel: "noopener noreferrer",
                      className:
                        "underline underline-offset-4 text-[color:var(--accent)]",
                      validate: { email: false },
                    }}
                  >
                    {roleRow.description}
                  </Linkify>
                </p>
              ) : null}
              {!roleRow.descriptionDocumentPath &&
              !roleRow.description?.trim() ? (
                <p className="text-[color:var(--muted)]">
                  No description yet.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] overflow-hidden">
            <div className="flex items-center justify-between rounded-t-xl border-b border-[color:var(--border)] bg-[color:var(--panel-header)] px-4 py-2">
              <h2 className="text-sm font-semibold text-[color:var(--foreground)]">
                Notes
              </h2>
            </div>
            <div className="p-6">
              <RoleNotesEditor roleId={roleId} initialNotes={roleRow.notes} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
