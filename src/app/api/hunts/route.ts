import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { hunt, huntStatus } from "@/db/schema";

export async function GET() {
  const rows = db
    .select({
      id: hunt.id,
      name: hunt.name,
      startDate: hunt.startDate,
      endDate: hunt.endDate,
      statusId: hunt.huntStatusId,
      status: huntStatus.name,
    })
    .from(hunt)
    .innerJoin(huntStatus, eq(hunt.huntStatusId, huntStatus.id))
    .orderBy(desc(hunt.startDate))
    .all();

  return NextResponse.json({ hunts: rows });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload.name !== "string") {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const name = payload.name.trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const statusId = Number(payload.huntStatusId);
  if (!Number.isInteger(statusId) || statusId <= 0) {
    return NextResponse.json(
      { error: "Valid huntStatusId is required." },
      { status: 400 }
    );
  }

  const statusExists = db
    .select({ id: huntStatus.id })
    .from(huntStatus)
    .where(eq(huntStatus.id, statusId))
    .get();

  if (!statusExists) {
    return NextResponse.json(
      { error: "Hunt status not found." },
      { status: 400 }
    );
  }

  const parsedStart =
    typeof payload.startDate === "string" && payload.startDate
      ? Date.parse(payload.startDate)
      : NaN;
  const startDate = Number.isNaN(parsedStart)
    ? new Date()
    : new Date(parsedStart);

  const parsedEnd =
    typeof payload.endDate === "string" && payload.endDate
      ? Date.parse(payload.endDate)
      : NaN;
  const endDate = Number.isNaN(parsedEnd) ? null : new Date(parsedEnd);

  const result = db
    .insert(hunt)
    .values({
      name,
      huntStatusId: statusId,
      startDate,
      endDate,
    })
    .run();

  return NextResponse.json({
    id: Number(result.lastInsertRowid),
    name,
    huntStatusId: statusId,
    startDate,
    endDate,
  });
}
