import path from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { loadEnvLocal } from "../lib/loadEnv";

loadEnvLocal();

const dbPath =
  process.env.SIGH_DB_LOCATION ??
  process.env.DATABASE_URL ??
  path.join(process.cwd(), "sigh.db");
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema });
