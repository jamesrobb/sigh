import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { company, interactionPerson, interactionRole, person, personTag, tag } from "@/db/schema";
import PeoplePanel from "@/app/components/PeoplePanel";
import GlobalNavLinks from "@/app/components/GlobalNavLinks";
import BreadcrumbNav from "@/app/components/BreadcrumbNav";

export const dynamic = "force-dynamic";

export default function PeopleIndexPage() {
  const people = db
    .select({
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      title: person.title,
      email: person.email,
      linkedin: person.linkedin,
      phone: person.phone,
      companyId: company.id,
      companyName: company.name,
    })
    .from(person)
    .innerJoin(company, eq(person.companyId, company.id))
    .orderBy(asc(person.firstName), asc(person.lastName), asc(person.id))
    .all();

  const tagRows = db
    .select({ id: tag.id, name: tag.name })
    .from(tag)
    .orderBy(asc(tag.name))
    .all();

  const personTagRows = db
    .select({ personId: personTag.personId, tagId: personTag.tagId })
    .from(personTag)
    .all();

  const personInteractionRows = db
    .select({
      personId: interactionPerson.personId,
      occurredAt: interactionPerson.occurredAt,
    })
    .from(interactionPerson)
    .all();

  const roleInteractionRows = db
    .select({
      personId: interactionRole.personId,
      occurredAt: interactionRole.occurredAt,
    })
    .from(interactionRole)
    .all();

  const interactionStatsByPerson = new Map<number, { count: number; last: number | null }>();
  const addInteractionStat = (
    personId: number | null,
    occurredAt: Date | number
  ) => {
    if (!personId) {
      return;
    }
    const timestamp = new Date(occurredAt).getTime();
    const entry = interactionStatsByPerson.get(personId) ?? {
      count: 0,
      last: null,
    };
    entry.count += 1;
    if (!Number.isNaN(timestamp)) {
      entry.last = entry.last === null ? timestamp : Math.max(entry.last, timestamp);
    }
    interactionStatsByPerson.set(personId, entry);
  };

  for (const entry of personInteractionRows) {
    addInteractionStat(Number(entry.personId), entry.occurredAt);
  }

  for (const entry of roleInteractionRows) {
    addInteractionStat(
      entry.personId === null ? null : Number(entry.personId),
      entry.occurredAt
    );
  }

  const tagIdsByPerson = new Map<number, number[]>();
  for (const entry of personTagRows) {
    const id = Number(entry.personId);
    const tagId = Number(entry.tagId);
    const list = tagIdsByPerson.get(id) ?? [];
    list.push(tagId);
    tagIdsByPerson.set(id, list);
  }

  const peopleWithTags = people.map((entry) => ({
    ...entry,
    tagIds: tagIdsByPerson.get(entry.id) ?? [],
    interactionCount: interactionStatsByPerson.get(entry.id)?.count ?? 0,
    lastInteractionAt: interactionStatsByPerson.get(entry.id)?.last ?? null,
  }));

  const companies = db
    .select({ id: company.id, name: company.name })
    .from(company)
    .orderBy(asc(company.id))
    .all();

  return (
    <main className="box-border px-6 pt-12 pb-10">
      <div className="fixed inset-x-0 top-0 z-30">
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex h-12 items-center justify-between rounded-b-lg border border-t-0 border-[color:var(--border)] bg-[color:var(--card)] px-6">
            <BreadcrumbNav items={[{ label: "People" }]} />
            <GlobalNavLinks />
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 pt-6">
        <header className="space-y-2 px-2">
          <h1 className="text-3xl font-semibold text-[color:var(--foreground)]">
            People
          </h1>
          <p className="text-sm text-[color:var(--muted)]">
            {people.length} total
          </p>
        </header>

        <PeoplePanel people={peopleWithTags} companies={companies} tags={tagRows} />
      </div>
    </main>
  );
}
