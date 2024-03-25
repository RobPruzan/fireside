import type { Config } from "drizzle-kit";
export default {
  schema: "./src/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString:
      "postgresql://test_user:test_password@localhost:5432/test_db",
  },
} satisfies Config;
