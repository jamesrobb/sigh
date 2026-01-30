import path from "path";
import { promises as fs } from "fs";
import crypto from "crypto";
import { loadEnvLocal } from "./loadEnv";

loadEnvLocal();

const attachmentsRoot =
  process.env.SIGH_ATTACHMENTS_LOCATION ??
  path.join(process.cwd(), "attachments");

export function getAttachmentsRoot() {
  return attachmentsRoot;
}

export async function ensureAttachmentsDir() {
  await fs.mkdir(attachmentsRoot, { recursive: true });
}

export function sanitizeFilename(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

export function buildStoredFilename(originalName: string) {
  const safeName = sanitizeFilename(originalName) || "document";
  const prefix = crypto.randomBytes(4).toString("hex").slice(0, 5);
  return `${prefix}_${safeName}`;
}

export function resolveAttachmentPath(fileName: string) {
  const safeName = path.basename(fileName);
  return path.join(attachmentsRoot, safeName);
}
