import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { company } from "@/db/schema";

export async function GET() {
  const rows = db
    .select({
      id: company.id,
      name: company.name,
      url: company.url,
      linkedin: company.linkedin,
    })
    .from(company)
    .orderBy(asc(company.id))
    .all();

  return NextResponse.json({
    companies: rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      url: row.url ?? null,
      linkedin: row.linkedin ?? null,
    })),
  });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const name =
    typeof payload?.name === "string" ? payload.name.trim() : "";
  if (!name) {
    return NextResponse.json(
      { error: "Company name is required." },
      { status: 400 }
    );
  }

  const existing = db
    .select({
      id: company.id,
      name: company.name,
      url: company.url,
      linkedin: company.linkedin,
    })
    .from(company)
    .where(eq(company.name, name))
    .get();

  if (existing) {
    return NextResponse.json({
      id: Number(existing.id),
      name: existing.name,
      url: existing.url ?? null,
      linkedin: existing.linkedin ?? null,
    });
  }

  const url =
    typeof payload?.url === "string" && payload.url.trim()
      ? payload.url.trim()
      : null;
  const linkedin =
    typeof payload?.linkedin === "string" && payload.linkedin.trim()
      ? payload.linkedin.trim()
      : null;

  const result = db
    .insert(company)
    .values({ name, url, linkedin })
    .run();

  return NextResponse.json({
    id: Number(result.lastInsertRowid),
    name,
    url,
    linkedin,
  });
}
