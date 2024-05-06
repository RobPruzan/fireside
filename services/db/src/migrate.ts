import { migrate } from "drizzle-orm/postgres-js/migrator";

import path from "path";
import { db, drizzleSql, migratingFlag } from "./db";

(async () => {
  migratingFlag.current = true;
  await migrate(db, {
    migrationsFolder: path.join(__dirname, "..", "drizzle"),
  });
  console.log("Migrated successfully!");

  await drizzleSql.end();
})();
