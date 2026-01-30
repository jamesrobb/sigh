import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { interactionRole, interactionTypeRole, person } from "@/db/schema";

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

  const existing = db
    .select({ id: interactionRole.id })
    .from(interactionRole)
    .where(eq(interactionRole.id, interactionId))
    .get();

  if (!existing) {
    return NextResponse.json(
      { error: "Interaction not found." },
      { status: 404 }
    );
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
    const personExists = db
      .select({ id: person.id })
      .from(person)
      .where(eq(person.id, personId))
      .get();

    if (!personExists) {
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

  db.update(interactionRole)
    .set({
      interactionTypeId,
      personId,
      occurredAt,
      notes,
    })
    .where(eq(interactionRole.id, interactionId))
    .run();

  return NextResponse.json({
    id: interactionId,
    interactionTypeId,
    personId,
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
    .select({ id: interactionRole.id })
    .from(interactionRole)
    .where(eq(interactionRole.id, interactionId))
    .get();

  if (!existing) {
    return NextResponse.json(
      { error: "Interaction not found." },
      { status: 404 }
    );
  }

  db.delete(interactionRole).where(eq(interactionRole.id, interactionId)).run();

  return NextResponse.json({ id: interactionId });
}
