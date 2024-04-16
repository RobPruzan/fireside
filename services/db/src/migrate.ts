import { migrate } from "drizzle-orm/postgres-js/migrator";

import path from "path";
import { db, drizzleSql } from "./db";

(async () => {
  await migrate(db, {
    migrationsFolder: path.join(__dirname, "..", "drizzle"),
  });
  console.log("Migrated successfully!");
  await drizzleSql.end();
})();
