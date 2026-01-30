import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { hunt, huntStatus, interactionRole, role, roleTag } from "@/db/schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseDate(value: unknown) {
  if (typeof value !== "string" || !value) {
    return null;
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return new Date(parsed);
}

export async function PATCH(request: Request, context: RouteContext) {
  const params = await context.params;
  const huntId = parseId(params?.id ?? "");
  if (!huntId) {
    return NextResponse.json(
      { error: "Valid hunt id is required." },
      { status: 400 }
    );
  }

  const existing = db
    .select({
      id: hunt.id,
      startDate: hunt.startDate,
      endDate: hunt.endDate,
    })
    .from(hunt)
    .where(eq(hunt.id, huntId))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Hunt not found." }, { status: 404 });
  }

  const payload = await request.json().catch(() => null);
  const updates: Record<string, unknown> = {};

  if (payload && Object.prototype.hasOwnProperty.call(payload, "name")) {
    if (typeof payload.name !== "string" || !payload.name.trim()) {
      return NextResponse.json(
        { error: "Hunt name is required." },
        { status: 400 }
      );
    }
    updates.name = payload.name.trim();
  }

  if (payload && Object.prototype.hasOwnProperty.call(payload, "huntStatusId")) {
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
    updates.huntStatusId = statusId;
  }

  let nextStart =
    existing.startDate instanceof Date
      ? existing.startDate
      : new Date(existing.startDate);
  let nextEnd =
    existing.endDate instanceof Date
      ? existing.endDate
      : existing.endDate
        ? new Date(existing.endDate)
        : null;

  if (payload && Object.prototype.hasOwnProperty.call(payload, "startDate")) {
    const parsedStart = parseDate(payload.startDate);
    if (!parsedStart) {
      return NextResponse.json(
        { error: "Valid start date is required." },
        { status: 400 }
      );
    }
    updates.startDate = parsedStart;
    nextStart = parsedStart;
  }

  if (payload && Object.prototype.hasOwnProperty.call(payload, "endDate")) {
    if (payload.endDate === null || payload.endDate === "") {
      updates.endDate = null;
      nextEnd = null;
    } else {
      const parsedEnd = parseDate(payload.endDate);
      if (!parsedEnd) {
        return NextResponse.json(
          { error: "End date must be a valid date." },
          { status: 400 }
        );
      }
      updates.endDate = parsedEnd;
      nextEnd = parsedEnd;
    }
  }

  if (nextEnd && nextEnd.getTime() < nextStart.getTime()) {
    return NextResponse.json(
      { error: "End date must be after the start date." },
      { status: 400 }
    );
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No updates provided." },
      { status: 400 }
    );
  }

  db.update(hunt).set(updates).where(eq(hunt.id, huntId)).run();

  return NextResponse.json({ id: huntId, ...updates });
}

export async function DELETE(_: Request, context: RouteContext) {
  const params = await context.params;
  const huntId = parseId(params?.id ?? "");
  if (!huntId) {
    return NextResponse.json(
      { error: "Valid hunt id is required." },
      { status: 400 }
    );
  }

  const existing = db
    .select({ id: hunt.id })
    .from(hunt)
    .where(eq(hunt.id, huntId))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Hunt not found." }, { status: 404 });
  }

  const roleIds = db
    .select({ id: role.id })
    .from(role)
    .where(eq(role.huntId, huntId))
    .all()
    .map((row) => row.id);

  if (roleIds.length > 0) {
    db.delete(interactionRole)
      .where(inArray(interactionRole.roleId, roleIds))
      .run();
    db.delete(roleTag).where(inArray(roleTag.roleId, roleIds)).run();
    db.delete(role).where(eq(role.huntId, huntId)).run();
  }

  db.delete(hunt).where(eq(hunt.id, huntId)).run();

  return NextResponse.json({ id: huntId });
}
