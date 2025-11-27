import { defineConfig } from "drizzle-kit";
import { getEnv } from "./core/utils/env";

export default defineConfig({
  dialect: "postgresql",
  schema: "./core/db/schemas.ts",
  out: "./core/db/migrations",
  dbCredentials: {
    url: getEnv("DATABASE_URL")
  }
});
