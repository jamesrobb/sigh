import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { interactionTypeRole } from "@/db/schema";

export async function GET() {
  const rows = db
    .select({ id: interactionTypeRole.id, name: interactionTypeRole.name })
    .from(interactionTypeRole)
    .orderBy(asc(interactionTypeRole.id))
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
    .select({ id: interactionTypeRole.id, name: interactionTypeRole.name })
    .from(interactionTypeRole)
    .where(eq(interactionTypeRole.name, name))
    .get();

  if (existing) {
    return NextResponse.json(existing);
  }

  const result = db.insert(interactionTypeRole).values({ name }).run();

  return NextResponse.json({
    id: Number(result.lastInsertRowid),
    name,
  });
}
