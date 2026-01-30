import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { interactionPerson, interactionTypePerson } from "@/db/schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const params = await context.params;
  const interactionId = parseId(params?.id ?? "");
  if (!interactionId) {
    return NextResponse.json(
      { error: "Valid interaction id is required." },
      { status: 400 }
    );
  }

  const payload = await request.json().catch(() => null);

  const interactionTypeId = Number(payload?.interactionTypeId);
  if (!Number.isInteger(interactionTypeId) || interactionTypeId <= 0) {
    return NextResponse.json(
      { error: "Valid interactionTypeId is required." },
      { status: 400 }
    );
  }

  const existing = db
    .select({ id: interactionPerson.id })
    .from(interactionPerson)
    .where(eq(interactionPerson.id, interactionId))
    .get();

  if (!existing) {
    return NextResponse.json(
      { error: "Interaction not found." },
      { status: 404 }
    );
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

  db.update(interactionPerson)
    .set({
      interactionTypeId,
      occurredAt,
      notes,
    })
    .where(eq(interactionPerson.id, interactionId))
    .run();

  return NextResponse.json({
    id: interactionId,
    interactionTypeId,
    occurredAt: occurredAt.toISOString(),
    notes,
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const params = await context.params;
  const interactionId = parseId(params?.id ?? "");
  if (!interactionId) {
    return NextResponse.json(
      { error: "Valid interaction id is required." },
      { status: 400 }
    );
  }

  const existing = db
    .select({ id: interactionPerson.id })
    .from(interactionPerson)
    .where(eq(interactionPerson.id, interactionId))
    .get();

  if (!existing) {
    return NextResponse.json(
      { error: "Interaction not found." },
      { status: 404 }
    );
  }

  db.delete(interactionPerson)
    .where(eq(interactionPerson.id, interactionId))
    .run();

  return NextResponse.json({ id: interactionId });
}
