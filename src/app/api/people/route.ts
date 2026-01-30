import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { company, person } from "@/db/schema";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  const companyId = Number(payload?.companyId);
  if (!Number.isInteger(companyId) || companyId <= 0) {
    return NextResponse.json(
      { error: "Valid companyId is required." },
      { status: 400 }
    );
  }

  const firstName =
    typeof payload?.firstName === "string" ? payload.firstName.trim() : "";
  const lastName =
    typeof payload?.lastName === "string" ? payload.lastName.trim() : "";
  if (!firstName || !lastName) {
    return NextResponse.json(
      { error: "First and last name are required." },
      { status: 400 }
    );
  }

  const companyRow = db
    .select({ id: company.id })
    .from(company)
    .where(eq(company.id, companyId))
    .get();

  if (!companyRow) {
    return NextResponse.json({ error: "Company not found." }, { status: 400 });
  }

  const title =
    typeof payload?.title === "string" && payload.title.trim()
      ? payload.title.trim()
      : null;
  const email =
    typeof payload?.email === "string" && payload.email.trim()
      ? payload.email.trim()
      : null;
  const phone =
    typeof payload?.phone === "string" && payload.phone.trim()
      ? payload.phone.trim()
      : null;
  const linkedin =
    typeof payload?.linkedin === "string" && payload.linkedin.trim()
      ? payload.linkedin.trim()
      : null;

  const result = db
    .insert(person)
    .values({
      companyId,
      firstName,
      lastName,
      title,
      email,
      phone,
      linkedin,
    })
    .run();

  return NextResponse.json({
    id: Number(result.lastInsertRowid),
    firstName,
    lastName,
    companyId,
  });
}
