import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDB } from "./index";
import { user } from "./schema";
import path from "path";

(async () => {
  const { db, sql } = createDB();
  await migrate(db, {
    migrationsFolder: path.join(__dirname, "..", "drizzle"),
  });

  const users = await db.select().from(user);
  await sql.end();
})();
