import type { Config } from "drizzle-kit";
console.log("what is it ", process.env.CONNECTION_STRING);
export default {
  schema: "./src/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.CONNECTION_STRING,
  },
} satisfies Config;
