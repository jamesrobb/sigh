import path from "path";
import { defineConfig } from "drizzle-kit";
import { loadEnvLocal } from "./src/lib/loadEnv";

loadEnvLocal();

const dbPath =
  process.env.SIGH_DB_LOCATION ??
  process.env.DATABASE_URL ??
  path.join(process.cwd(), "sigh.db");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
});
