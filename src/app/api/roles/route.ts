import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { company, currency, hunt, role } from "@/db/schema";

export async function POST(request: Request) {
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

  if (!payload || typeof payload.title !== "string") {
    return NextResponse.json(
      { error: "Role title is required." },
      { status: 400 }
    );
  }

  const title = payload.title.trim();
  if (!title) {
    return NextResponse.json(
      { error: "Role title is required." },
      { status: 400 }
    );
  }

  const huntId = Number(payload.huntId);
  if (!Number.isInteger(huntId) || huntId <= 0) {
    return NextResponse.json({ error: "Valid huntId is required." }, { status: 400 });
  }

  const rawCompanyId = Number(payload.companyId);
  const companyIdFromPayload =
    Number.isInteger(rawCompanyId) && rawCompanyId > 0 ? rawCompanyId : null;
  const companyName =
    typeof payload.companyName === "string" ? payload.companyName.trim() : "";

  if (!companyIdFromPayload && !companyName) {
    return NextResponse.json(
      { error: "Company name is required." },
      { status: 400 }
    );
  }

  const huntExists = db
    .select({ id: hunt.id })
    .from(hunt)
    .where(eq(hunt.id, huntId))
    .get();

  if (!huntExists) {
    return NextResponse.json({ error: "Hunt not found." }, { status: 400 });
  }

  let companyId = companyIdFromPayload;
  if (companyId) {
    const companyExists = db
      .select({ id: company.id })
      .from(company)
      .where(eq(company.id, companyId))
      .get();

    if (!companyExists) {
      return NextResponse.json(
        { error: "Company not found." },
        { status: 400 }
      );
    }
  } else {
    const existingCompany = db
      .select({ id: company.id })
      .from(company)
      .where(eq(company.name, companyName))
      .get();

    companyId = existingCompany?.id ?? null;
    if (!companyId) {
      const companyUrl =
        typeof payload.companyUrl === "string" && payload.companyUrl.trim()
          ? payload.companyUrl.trim()
          : null;
      const companyLinkedin =
        typeof payload.companyLinkedin === "string" &&
        payload.companyLinkedin.trim()
          ? payload.companyLinkedin.trim()
          : null;

      const companyInsert = db
        .insert(company)
        .values({ name: companyName, url: companyUrl, linkedin: companyLinkedin })
        .run();
      companyId = Number(companyInsert.lastInsertRowid);
    }
  }

  const description =
    typeof payload.description === "string" && payload.description.trim()
      ? payload.description.trim()
      : null;

  const lowerResult = parseSalary(payload.salaryLowerEnd, "Salary lower end");
  if (!lowerResult.ok) {
    return NextResponse.json({ error: lowerResult.error }, { status: 400 });
  }
  const higherResult = parseSalary(payload.salaryHigherEnd, "Salary higher end");
  if (!higherResult.ok) {
    return NextResponse.json({ error: higherResult.error }, { status: 400 });
  }
  const salaryLowerEnd = lowerResult.value;
  const salaryHigherEnd = higherResult.value;
  if (
    salaryLowerEnd !== null &&
    salaryHigherEnd !== null &&
    salaryLowerEnd > salaryHigherEnd
  ) {
    return NextResponse.json(
      { error: "Salary lower end must be less than or equal to the higher end." },
      { status: 400 }
    );
  }

  let currencyId: number | null = null;
  if (payload && Object.prototype.hasOwnProperty.call(payload, "currencyId")) {
    const rawCurrencyId =
      payload.currencyId === null ? null : Number(payload.currencyId);
    if (rawCurrencyId === null) {
      currencyId = null;
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
      currencyId = rawCurrencyId;
    }
  }

  const createdAt = new Date();
  const result = db
    .insert(role)
    .values({
      huntId,
      companyId,
      title,
      createdAt,
      description,
      salaryLowerEnd,
      salaryHigherEnd,
      currencyId,
    })
    .run();

  return NextResponse.json({
    id: Number(result.lastInsertRowid),
    huntId,
    companyId,
    title,
    createdAt: createdAt.toISOString(),
    description,
    salaryLowerEnd,
    salaryHigherEnd,
    currencyId,
  });
}
