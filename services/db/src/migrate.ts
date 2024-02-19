import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, sql } from ".";
import { user } from "./schema";
import path from "path";

(async () => {
  await migrate(db, {
    migrationsFolder: path.join(__dirname, "..", "drizzle"),
  });

  const users = await db.select().from(user);
  console.log("users:", users);
  await sql.end();
})();
