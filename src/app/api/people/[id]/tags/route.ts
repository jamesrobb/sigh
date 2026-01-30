import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { person, personTag, tag } from "@/db/schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(request: Request, context: RouteContext) {
  const params = await context.params;
  const personId = parseId(params?.id ?? "");
  if (!personId) {
    return NextResponse.json(
      { error: "Valid person id is required." },
      { status: 400 }
    );
  }

  const payload = await request.json().catch(() => null);
  const tagId = Number(payload?.tagId);
  if (!Number.isInteger(tagId) || tagId <= 0) {
    return NextResponse.json(
      { error: "Valid tag id is required." },
      { status: 400 }
    );
  }

  const personExists = db
    .select({ id: person.id })
    .from(person)
    .where(eq(person.id, personId))
    .get();
  if (!personExists) {
    return NextResponse.json({ error: "Person not found." }, { status: 404 });
  }

  const tagExists = db
    .select({ id: tag.id })
    .from(tag)
    .where(eq(tag.id, tagId))
    .get();
  if (!tagExists) {
    return NextResponse.json({ error: "Tag not found." }, { status: 404 });
  }

  const existing = db
    .select({ personId: personTag.personId })
    .from(personTag)
    .where(and(eq(personTag.personId, personId), eq(personTag.tagId, tagId)))
    .get();
  if (existing) {
    return NextResponse.json({ personId, tagId });
  }

  db.insert(personTag).values({ personId, tagId }).run();

  return NextResponse.json({ personId, tagId });
}

export async function DELETE(request: Request, context: RouteContext) {
  const params = await context.params;
  const personId = parseId(params?.id ?? "");
  if (!personId) {
    return NextResponse.json(
      { error: "Valid person id is required." },
      { status: 400 }
    );
  }

  const payload = await request.json().catch(() => null);
  const tagId = Number(payload?.tagId);
  if (!Number.isInteger(tagId) || tagId <= 0) {
    return NextResponse.json(
      { error: "Valid tag id is required." },
      { status: 400 }
    );
  }

  db.delete(personTag)
    .where(and(eq(personTag.personId, personId), eq(personTag.tagId, tagId)))
    .run();

  return NextResponse.json({ personId, tagId });
}
