import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { currency } from "@/db/schema";

export async function GET() {
  const rows = db
    .select({ id: currency.id, code: currency.code })
    .from(currency)
    .orderBy(asc(currency.code))
    .all();

  return NextResponse.json({
    currencies: rows.map((row) => ({
      id: Number(row.id),
      code: row.code,
    })),
  });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const rawCode = typeof payload?.code === "string" ? payload.code.trim() : "";
  const code = rawCode.toUpperCase();
  if (!code) {
    return NextResponse.json(
      { error: "Currency code is required." },
      { status: 400 }
    );
  }

  const existing = db
    .select({ id: currency.id, code: currency.code })
    .from(currency)
    .where(eq(currency.code, code))
    .get();

  if (existing) {
    return NextResponse.json({
      id: Number(existing.id),
      code: existing.code,
    });
  }

  const result = db.insert(currency).values({ code }).run();
  return NextResponse.json({ id: Number(result.lastInsertRowid), code });
}
