import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { huntStatus } from "@/db/schema";

export async function GET() {
  const rows = db
    .select({ id: huntStatus.id, name: huntStatus.name })
    .from(huntStatus)
    .orderBy(asc(huntStatus.name))
    .all();

  return NextResponse.json({ statuses: rows });
}
