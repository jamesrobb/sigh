import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { promises as fs } from "fs";
import { db } from "@/db";
import { role } from "@/db/schema";
import {
  buildStoredFilename,
  ensureAttachmentsDir,
  resolveAttachmentPath,
} from "@/lib/attachments";

export const runtime = "nodejs";

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

  const existing = db
    .select({
      id: role.id,
      descriptionDocumentPath: role.descriptionDocumentPath,
    })
    .from(role)
    .where(eq(role.id, roleId))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Role not found." }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "A file is required." },
      { status: 400 }
    );
  }

  await ensureAttachmentsDir();
  const storedName = buildStoredFilename(file.name || "document");
  const filePath = resolveAttachmentPath(storedName);

  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));

  if (existing.descriptionDocumentPath) {
    const previousPath = resolveAttachmentPath(existing.descriptionDocumentPath);
    fs.unlink(previousPath).catch(() => null);
  }

  db.update(role)
    .set({
      descriptionDocumentPath: storedName,
      descriptionDocumentName: file.name || storedName,
    })
    .where(eq(role.id, roleId))
    .run();

  return NextResponse.json({
    ok: true,
    storedName,
    name: file.name || storedName,
  });
}

export async function DELETE(_: Request, context: RouteContext) {
  const params = await context.params;
  const roleId = parseId(params?.id ?? "");
  if (!roleId) {
    return NextResponse.json(
      { error: "Valid role id is required." },
      { status: 400 }
    );
  }

  const existing = db
    .select({
      id: role.id,
      descriptionDocumentPath: role.descriptionDocumentPath,
    })
    .from(role)
    .where(eq(role.id, roleId))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Role not found." }, { status: 404 });
  }

  if (existing.descriptionDocumentPath) {
    const previousPath = resolveAttachmentPath(existing.descriptionDocumentPath);
    await fs.unlink(previousPath).catch(() => null);
  }

  db.update(role)
    .set({
      descriptionDocumentPath: null,
      descriptionDocumentName: null,
    })
    .where(eq(role.id, roleId))
    .run();

  return NextResponse.json({ ok: true });
}
