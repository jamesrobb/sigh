import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { promises as fs } from "fs";
import { db } from "@/db";
import { company, currency, interactionRole, role, roleTag } from "@/db/schema";
import { resolveAttachmentPath } from "@/lib/attachments";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const params = await context.params;
  const roleId = parseId(params?.id ?? "");
  if (!roleId) {
    return NextResponse.json(
      { error: "Valid role id is required." },
      { status: 400 }
    );
  }

  const payload = await request.json().catch(() => null);
  type SalaryResult =
    | { ok: true; value: number | null }
    | { ok: false; error: string };
  const parseSalary = (raw: unknown, label: string): SalaryResult => {
    if (raw === undefined || raw === null || raw === "") {
      return { ok: true, value: null };
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
      return { ok: false, error: `${label} must be a whole number.` };
    }
    return { ok: true, value: parsed };
  };

  const existing = db
    .select({
      id: role.id,
      salaryLowerEnd: role.salaryLowerEnd,
      salaryHigherEnd: role.salaryHigherEnd,
      currencyId: role.currencyId,
    })
    .from(role)
    .where(eq(role.id, roleId))
    .get();

  if (!existing) {
    return NextResponse.json({ error: "Role not found." }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};

  if (payload && Object.prototype.hasOwnProperty.call(payload, "notes")) {
    updates.notes =
      typeof payload.notes === "string" && payload.notes.trim()
        ? payload.notes.trim()
        : null;
  }

  if (payload && Object.prototype.hasOwnProperty.call(payload, "title")) {
    if (typeof payload.title !== "string" || !payload.title.trim()) {
      return NextResponse.json(
        { error: "Role title is required." },
        { status: 400 }
      );
    }
    updates.title = payload.title.trim();
  }

  if (payload && Object.prototype.hasOwnProperty.call(payload, "description")) {
    updates.description =
      typeof payload.description === "string" && payload.description.trim()
        ? payload.description.trim()
        : null;
  }

  let nextLower = existing.salaryLowerEnd ?? null;
  let nextHigher = existing.salaryHigherEnd ?? null;
  if (payload && Object.prototype.hasOwnProperty.call(payload, "salaryLowerEnd")) {
    const lowerResult = parseSalary(payload.salaryLowerEnd, "Salary lower end");
    if (!lowerResult.ok) {
      return NextResponse.json({ error: lowerResult.error }, { status: 400 });
    }
    nextLower = lowerResult.value;
    updates.salaryLowerEnd = nextLower;
  }
  if (payload && Object.prototype.hasOwnProperty.call(payload, "salaryHigherEnd")) {
    const higherResult = parseSalary(payload.salaryHigherEnd, "Salary higher end");
    if (!higherResult.ok) {
      return NextResponse.json({ error: higherResult.error }, { status: 400 });
    }
    nextHigher = higherResult.value;
    updates.salaryHigherEnd = nextHigher;
  }

  if (nextLower !== null && nextHigher !== null && nextLower > nextHigher) {
    return NextResponse.json(
      { error: "Salary lower end must be less than or equal to the higher end." },
      { status: 400 }
    );
  }

  if (payload && Object.prototype.hasOwnProperty.call(payload, "currencyId")) {
    const rawCurrencyId =
      payload.currencyId === null ? null : Number(payload.currencyId);
    if (rawCurrencyId === null) {
      updates.currencyId = null;
    } else if (!Number.isInteger(rawCurrencyId) || rawCurrencyId <= 0) {
      return NextResponse.json(
        { error: "Valid currencyId is required." },
        { status: 400 }
      );
    } else {
      const currencyExists = db
        .select({ id: currency.id })
        .from(currency)
        .where(eq(currency.id, rawCurrencyId))
        .get();
      if (!currencyExists) {
        return NextResponse.json(
          { error: "Currency not found." },
          { status: 400 }
        );
      }
      updates.currencyId = rawCurrencyId;
    }
  }

  if (payload && Object.prototype.hasOwnProperty.call(payload, "companyId")) {
    const companyId = Number(payload.companyId);
    if (!Number.isInteger(companyId) || companyId <= 0) {
      return NextResponse.json(
        { error: "Valid companyId is required." },
        { status: 400 }
      );
    }
    const companyExists = db
      .select({ id: company.id })
      .from(company)
      .where(eq(company.id, companyId))
      .get();
    if (!companyExists) {
      return NextResponse.json({ error: "Company not found." }, { status: 400 });
    }
    updates.companyId = companyId;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No updates provided." },
      { status: 400 }
    );
  }

  db.update(role).set(updates).where(eq(role.id, roleId)).run();

  return NextResponse.json({ id: roleId, ...updates });
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

  db.delete(interactionRole).where(eq(interactionRole.roleId, roleId)).run();
  db.delete(roleTag).where(eq(roleTag.roleId, roleId)).run();
  db.delete(role).where(eq(role.id, roleId)).run();

  if (existing.descriptionDocumentPath) {
    const attachmentPath = resolveAttachmentPath(existing.descriptionDocumentPath);
    fs.unlink(attachmentPath).catch(() => null);
  }

  return NextResponse.json({ id: roleId });
}
