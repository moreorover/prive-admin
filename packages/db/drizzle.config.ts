import { defineConfig } from "drizzle-kit";
import { env } from "@prive-admin/env/server";

export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
