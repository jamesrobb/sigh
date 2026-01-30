import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  company,
  interactionPerson,
  interactionRole,
  person,
  personTag,
  role,
  roleTag,
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
  const companyId = parseId(params?.id ?? "");
  if (!companyId) {
    return NextResponse.json(
      { error: "Valid company id is required." },
      { status: 400 }
    );
  }

  const existing = db
    .select({ id: company.id })
    .from(company)
    .where(eq(company.id, companyId))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  const payload = await request.json().catch(() => null);
  const updates: Record<string, unknown> = {};

  if (payload && Object.prototype.hasOwnProperty.call(payload, "name")) {
    if (typeof payload.name !== "string" || !payload.name.trim()) {
      return NextResponse.json(
        { error: "Company name is required." },
        { status: 400 }
      );
    }
    updates.name = payload.name.trim();
  }

  if (payload && Object.prototype.hasOwnProperty.call(payload, "url")) {
    updates.url =
      typeof payload.url === "string" && payload.url.trim()
        ? payload.url.trim()
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

  db.update(company).set(updates).where(eq(company.id, companyId)).run();

  return NextResponse.json({ id: companyId, ...updates });
}

export async function DELETE(_: Request, context: RouteContext) {
  const params = await context.params;
  const companyId = parseId(params?.id ?? "");
  if (!companyId) {
    return NextResponse.json(
      { error: "Valid company id is required." },
      { status: 400 }
    );
  }

  const existing = db
    .select({ id: company.id })
    .from(company)
    .where(eq(company.id, companyId))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  const roleIds = db
    .select({ id: role.id })
    .from(role)
    .where(eq(role.companyId, companyId))
    .all()
    .map((row) => row.id);

  if (roleIds.length > 0) {
    db.delete(interactionRole)
      .where(inArray(interactionRole.roleId, roleIds))
      .run();
    db.delete(roleTag).where(inArray(roleTag.roleId, roleIds)).run();
    db.delete(role).where(eq(role.companyId, companyId)).run();
  }

  const personIds = db
    .select({ id: person.id })
    .from(person)
    .where(eq(person.companyId, companyId))
    .all()
    .map((row) => row.id);

  if (personIds.length > 0) {
    db.update(interactionRole)
      .set({ personId: null })
      .where(inArray(interactionRole.personId, personIds))
      .run();
    db.delete(interactionPerson)
      .where(inArray(interactionPerson.personId, personIds))
      .run();
    db.delete(personTag).where(inArray(personTag.personId, personIds)).run();
    db.delete(person).where(eq(person.companyId, companyId)).run();
  }

  db.delete(company).where(eq(company.id, companyId)).run();

  return NextResponse.json({ id: companyId });
}
