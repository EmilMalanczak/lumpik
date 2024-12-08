import { defineConfig } from "drizzle-kit";

import { TABLE_PREFIX } from "./src/utils/lumpik-table";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
  schema: ["./src/tables", "./src/relations"],
  out: "../db-migrate/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  tablesFilter: [TABLE_PREFIX],
});
