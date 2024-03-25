import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDB } from "./index";
import path from "path";

(async () => {
  const { db, sql } = createDB({
    connString: process.env.CONNECTION_STRING,
  });
  await migrate(db, {
    migrationsFolder: path.join(__dirname, "..", "drizzle"),
  });
  console.log("Migrated successfully!");
  await sql.end();
})();
