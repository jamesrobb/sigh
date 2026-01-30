import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { interactionRole, interactionTypeRole, person, role } from "@/db/schema";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  const roleId = Number(payload?.roleId);
  if (!Number.isInteger(roleId) || roleId <= 0) {
    return NextResponse.json({ error: "Valid roleId is required." }, { status: 400 });
  }

  const interactionTypeId = Number(payload?.interactionTypeId);
  if (!Number.isInteger(interactionTypeId) || interactionTypeId <= 0) {
    return NextResponse.json(
      { error: "Valid interactionTypeId is required." },
      { status: 400 }
    );
  }

  const rawPersonId = payload?.personId;
  let personId: number | null = null;
  if (rawPersonId !== undefined && rawPersonId !== null && rawPersonId !== "") {
    const parsed = Number(rawPersonId);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return NextResponse.json(
        { error: "Valid personId is required." },
        { status: 400 }
      );
    }
    personId = parsed;
  }

  const roleRow = db
    .select({ id: role.id, companyId: role.companyId })
    .from(role)
    .where(eq(role.id, roleId))
    .get();

  if (!roleRow) {
    return NextResponse.json({ error: "Role not found." }, { status: 400 });
  }

  const typeExists = db
    .select({ id: interactionTypeRole.id })
    .from(interactionTypeRole)
    .where(eq(interactionTypeRole.id, interactionTypeId))
    .get();

  if (!typeExists) {
    return NextResponse.json(
      { error: "Interaction type not found." },
      { status: 400 }
    );
  }

  if (personId) {
    const personRow = db
      .select({ id: person.id })
      .from(person)
      .where(eq(person.id, personId))
      .get();

    if (!personRow) {
      return NextResponse.json({ error: "Person not found." }, { status: 400 });
    }
  }

  const parsedDate =
    typeof payload?.occurredAt === "string" && payload.occurredAt
      ? Date.parse(payload.occurredAt)
      : NaN;
  const occurredAt = Number.isNaN(parsedDate) ? new Date() : new Date(parsedDate);

  const notes =
    typeof payload?.notes === "string" && payload.notes.trim()
      ? payload.notes.trim()
      : null;

  const result = db
    .insert(interactionRole)
    .values({
      companyId: roleRow.companyId,
      personId,
      roleId,
      interactionTypeId,
      occurredAt,
      notes,
    })
    .run();

  return NextResponse.json({
    id: Number(result.lastInsertRowid),
    roleId,
    personId,
    interactionTypeId,
    occurredAt: occurredAt.toISOString(),
    notes,
  });
}
