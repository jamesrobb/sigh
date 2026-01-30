import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { inArray } from "drizzle-orm";
import * as schema from "./schema";
import { huntStatus } from "./schema";
import { loadEnvLocal } from "../lib/loadEnv";

loadEnvLocal();

const dbPath =
  process.env.SIGH_DB_LOCATION ??
  process.env.DATABASE_URL ??
  path.join(process.cwd(), "sigh.db");
const dbFiles = [dbPath, `${dbPath}-shm`, `${dbPath}-wal`];

for (const file of dbFiles) {
  if (fs.existsSync(file)) {
    fs.rmSync(file);
  }
}

const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });

const statuses = ["active", "cancelled", "failed", "success"];
const existing = db
  .select({ name: huntStatus.name })
  .from(huntStatus)
  .where(inArray(huntStatus.name, statuses))
  .all();
const existingNames = new Set(existing.map((row) => row.name));
const toInsert = statuses
  .filter((name) => !existingNames.has(name))
  .map((name) => ({ name }));

if (toInsert.length > 0) {
  db.insert(huntStatus).values(toInsert).run();
}

const roleInteractionTypes = [
  "Email",
  "Phone Call",
  "Instant Message",
  "Rejected",
  "Application Submitted",
  "Ghosted",
  "Interviewed",
  "Offer Received",
  "Offer Accepted",
  "Offer Declined",
  "Decision To Not Pursue",
];

const existingRoleInteractionTypes = db
  .select({ name: schema.interactionTypeRole.name })
  .from(schema.interactionTypeRole)
  .where(inArray(schema.interactionTypeRole.name, roleInteractionTypes))
  .all();
const existingRoleInteractionNames = new Set(
  existingRoleInteractionTypes.map((row) => row.name)
);
const roleInteractionInserts = roleInteractionTypes
  .filter((name) => !existingRoleInteractionNames.has(name))
  .map((name) => ({ name }));

if (roleInteractionInserts.length > 0) {
  db.insert(schema.interactionTypeRole).values(roleInteractionInserts).run();
}

const personInteractionTypes = ["Email", "Phone Call", "Instant Message"];
const existingPersonInteractionTypes = db
  .select({ name: schema.interactionTypePerson.name })
  .from(schema.interactionTypePerson)
  .where(inArray(schema.interactionTypePerson.name, personInteractionTypes))
  .all();
const existingPersonInteractionNames = new Set(
  existingPersonInteractionTypes.map((row) => row.name)
);
const personInteractionInserts = personInteractionTypes
  .filter((name) => !existingPersonInteractionNames.has(name))
  .map((name) => ({ name }));

if (personInteractionInserts.length > 0) {
  db.insert(schema.interactionTypePerson).values(personInteractionInserts).run();
}

const currencyCodes = ["USD", "EUR", "GBP", "CAD"];
const existingCurrencies = db
  .select({ code: schema.currency.code })
  .from(schema.currency)
  .where(inArray(schema.currency.code, currencyCodes))
  .all();
const existingCurrencyCodes = new Set(existingCurrencies.map((row) => row.code));
const currencyInserts = currencyCodes
  .filter((code) => !existingCurrencyCodes.has(code))
  .map((code) => ({ code }));

if (currencyInserts.length > 0) {
  db.insert(schema.currency).values(currencyInserts).run();
}

sqlite.close();
