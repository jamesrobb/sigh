import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  company,
  interactionPerson,
  interactionRole,
  person,
  personTag,
} from "@/db/schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const params = await context.params;
  const personId = parseId(params?.id ?? "");
  if (!personId) {
    return NextResponse.json(
      { error: "Valid person id is required." },
      { status: 400 }
    );
  }

  const existing = db
    .select({ id: person.id })
    .from(person)
    .where(eq(person.id, personId))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Person not found." }, { status: 404 });
  }

  const payload = await request.json().catch(() => null);
  const updates: Record<string, unknown> = {};

  if (payload && Object.prototype.hasOwnProperty.call(payload, "firstName")) {
    if (typeof payload.firstName !== "string" || !payload.firstName.trim()) {
      return NextResponse.json(
        { error: "First name is required." },
        { status: 400 }
      );
    }
    updates.firstName = payload.firstName.trim();
  }

  if (payload && Object.prototype.hasOwnProperty.call(payload, "lastName")) {
    if (typeof payload.lastName !== "string" || !payload.lastName.trim()) {
      return NextResponse.json(
        { error: "Last name is required." },
        { status: 400 }
      );
    }
    updates.lastName = payload.lastName.trim();
  }

  if (payload && Object.prototype.hasOwnProperty.call(payload, "companyId")) {
    const companyId = Number(payload.companyId);
    if (!Number.isInteger(companyId) || companyId <= 0) {
      return NextResponse.json(
        { error: "Valid companyId is required." },
        { status: 400 }
      );
    }
    const companyExists = db
      .select({ id: company.id })
      .from(company)
      .where(eq(company.id, companyId))
      .get();
    if (!companyExists) {
      return NextResponse.json({ error: "Company not found." }, { status: 400 });
    }
    updates.companyId = companyId;
  }

  if (payload && Object.prototype.hasOwnProperty.call(payload, "title")) {
    updates.title =
      typeof payload.title === "string" && payload.title.trim()
        ? payload.title.trim()
        : null;
  }

  if (payload && Object.prototype.hasOwnProperty.call(payload, "email")) {
    updates.email =
      typeof payload.email === "string" && payload.email.trim()
        ? payload.email.trim()
        : null;
  }

  if (payload && Object.prototype.hasOwnProperty.call(payload, "phone")) {
    updates.phone =
      typeof payload.phone === "string" && payload.phone.trim()
        ? payload.phone.trim()
        : null;
  }

  if (payload && Object.prototype.hasOwnProperty.call(payload, "linkedin")) {
    updates.linkedin =
      typeof payload.linkedin === "string" && payload.linkedin.trim()
        ? payload.linkedin.trim()
        : null;
  }

  if (payload && Object.prototype.hasOwnProperty.call(payload, "notes")) {
    updates.notes =
      typeof payload.notes === "string" && payload.notes.trim()
        ? payload.notes.trim()
        : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No updates provided." },
      { status: 400 }
    );
  }

  db.update(person).set(updates).where(eq(person.id, personId)).run();

  return NextResponse.json({ id: personId, ...updates });
}

export async function DELETE(_: Request, context: RouteContext) {
  const params = await context.params;
  const personId = parseId(params?.id ?? "");
  if (!personId) {
    return NextResponse.json(
      { error: "Valid person id is required." },
      { status: 400 }
    );
  }

  const existing = db
    .select({ id: person.id })
    .from(person)
    .where(eq(person.id, personId))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Person not found." }, { status: 404 });
  }

  db.update(interactionRole)
    .set({ personId: null })
    .where(eq(interactionRole.personId, personId))
    .run();

  db.delete(interactionPerson)
    .where(eq(interactionPerson.personId, personId))
    .run();

  db.delete(personTag).where(eq(personTag.personId, personId)).run();

  db.delete(person).where(eq(person.id, personId)).run();

  return NextResponse.json({ id: personId });
}
