import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { tag } from "@/db/schema";

export async function GET() {
  const rows = db
    .select({ id: tag.id, name: tag.name })
    .from(tag)
    .orderBy(asc(tag.name))
    .all();

  return NextResponse.json({
    tags: rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
    })),
  });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  if (!name) {
    return NextResponse.json(
      { error: "Tag name is required." },
      { status: 400 }
    );
  }

  const existing = db
    .select({ id: tag.id, name: tag.name })
    .from(tag)
    .where(eq(tag.name, name))
    .get();

  if (existing) {
    return NextResponse.json({ id: Number(existing.id), name: existing.name });
  }

  const result = db.insert(tag).values({ name }).run();

  return NextResponse.json({ id: Number(result.lastInsertRowid), name });
}
