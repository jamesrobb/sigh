import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { interactionTypePerson } from "@/db/schema";

export async function GET() {
  const rows = db
    .select({ id: interactionTypePerson.id, name: interactionTypePerson.name })
    .from(interactionTypePerson)
    .orderBy(asc(interactionTypePerson.id))
    .all();

  return NextResponse.json({ types: rows });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload.name !== "string") {
    return NextResponse.json(
      { error: "Interaction type name is required." },
      { status: 400 }
    );
  }

  const name = payload.name.trim();
  if (!name) {
    return NextResponse.json(
      { error: "Interaction type name is required." },
      { status: 400 }
    );
  }

  const existing = db
    .select({ id: interactionTypePerson.id, name: interactionTypePerson.name })
    .from(interactionTypePerson)
    .where(eq(interactionTypePerson.name, name))
    .get();

  if (existing) {
    return NextResponse.json(existing);
  }

  const result = db.insert(interactionTypePerson).values({ name }).run();

  return NextResponse.json({
    id: Number(result.lastInsertRowid),
    name,
  });
}
