import { eq } from "drizzle-orm";

import { emojis, reactionAsset, token, user } from "./schema";
import { db, drizzleSql, migratingFlag } from "./db";
migratingFlag.current = true;
import { getHash } from "@fireside/backend/src/user-endpoints";

(async () => {
  const corbinExists = await db
    .select()
    .from(user)
    .where(eq(user.username, "Corbin"))
    .then((data) => data.at(0));

  if (corbinExists) {
    await drizzleSql.end();
    console.log("die");
    return;
  }
  const tokenRes = await db
    .insert(token)
    .values({
      value: await getHash({ str: crypto.randomUUID() }),
    })
    .returning()
    .then((data) => data[0]);
  await db.insert(user).values({
    password: await getHash({ str: crypto.randomUUID() }),
    username: "Corbin",
    displayName: "Corbin Borgle",
    token: tokenRes.value,
    id: "ai-corbin",
  });
  console.log("die");
  await drizzleSql.end();
})();
