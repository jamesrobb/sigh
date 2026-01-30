import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { role, roleTag, tag } from "@/db/schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(request: Request, context: RouteContext) {
  const params = await context.params;
  const roleId = parseId(params?.id ?? "");
  if (!roleId) {
    return NextResponse.json(
      { error: "Valid role id is required." },
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

  const roleExists = db
    .select({ id: role.id })
    .from(role)
    .where(eq(role.id, roleId))
    .get();
  if (!roleExists) {
    return NextResponse.json({ error: "Role not found." }, { status: 404 });
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
    .select({ roleId: roleTag.roleId })
    .from(roleTag)
    .where(and(eq(roleTag.roleId, roleId), eq(roleTag.tagId, tagId)))
    .get();
  if (existing) {
    return NextResponse.json({ roleId, tagId });
  }

  db.insert(roleTag).values({ roleId, tagId }).run();

  return NextResponse.json({ roleId, tagId });
}

export async function DELETE(request: Request, context: RouteContext) {
  const params = await context.params;
  const roleId = parseId(params?.id ?? "");
  if (!roleId) {
    return NextResponse.json(
      { error: "Valid role id is required." },
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

  db.delete(roleTag)
    .where(and(eq(roleTag.roleId, roleId), eq(roleTag.tagId, tagId)))
    .run();

  return NextResponse.json({ roleId, tagId });
}
