import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { interactionPerson, interactionTypePerson, person } from "@/db/schema";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  const personId = Number(payload?.personId);
  if (!Number.isInteger(personId) || personId <= 0) {
    return NextResponse.json(
      { error: "Valid personId is required." },
      { status: 400 }
    );
  }

  const interactionTypeId = Number(payload?.interactionTypeId);
  if (!Number.isInteger(interactionTypeId) || interactionTypeId <= 0) {
    return NextResponse.json(
      { error: "Valid interactionTypeId is required." },
      { status: 400 }
    );
  }

  const personRow = db
    .select({ id: person.id })
    .from(person)
    .where(eq(person.id, personId))
    .get();

  if (!personRow) {
    return NextResponse.json({ error: "Person not found." }, { status: 400 });
  }

  const typeExists = db
    .select({ id: interactionTypePerson.id })
    .from(interactionTypePerson)
    .where(eq(interactionTypePerson.id, interactionTypeId))
    .get();

  if (!typeExists) {
    return NextResponse.json(
      { error: "Interaction type not found." },
      { status: 400 }
    );
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
    .insert(interactionPerson)
    .values({
      personId,
      interactionTypeId,
      occurredAt,
      notes,
    })
    .run();

  return NextResponse.json({
    id: Number(result.lastInsertRowid),
    personId,
    interactionTypeId,
    occurredAt: occurredAt.toISOString(),
    notes,
  });
}
