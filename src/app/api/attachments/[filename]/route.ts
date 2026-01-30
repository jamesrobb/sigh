import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { resolveAttachmentPath } from "@/lib/attachments";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ filename: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const params = await context.params;
  const rawName = params?.filename ?? "";
  const safeName = path.basename(rawName);
  if (!safeName) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const filePath = resolveAttachmentPath(safeName);
  try {
    const file = await fs.readFile(filePath);
    const headers = new Headers();
    headers.set("Content-Type", "application/octet-stream");
    headers.set("Content-Disposition", `inline; filename="${safeName}"`);
    return new NextResponse(file, { headers });
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}
