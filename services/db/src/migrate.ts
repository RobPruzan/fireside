import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq } from "drizzle-orm";
import path from "path";
import { getHash } from "@fireside/backend/src/user-endpoints";
import { emojis, reactionAsset, token, user } from "./schema";
import { db, drizzleSql, migratingFlag } from "./db";
migratingFlag.current = true;

(async () => {
  console.log("10");
  await migrate(db, {
    migrationsFolder: path.join(__dirname, "..", "drizzle"),
  });
  console.log("Migrated successfully!");

  await Promise.all(
    emojis.map(async (emoji) => {
      console.log("22");
      const hasEmoji = (
        await db
          .select()
          .from(reactionAsset)
          .where(eq(reactionAsset.alt, emoji.alt))
      ).at(0);
      console.log("23");

      if (!hasEmoji) {
        // console.log("24");
        // await drizzleSql.end();
        // console.log("28");
        // return;
        console.log("30");
        return db.insert(reactionAsset).values({
          alt: emoji.alt,
          imgSrc: emoji.src,
        });
      }
    })
  );
  console.log("37");
  const corbinExists = await db
    .select()
    .from(user)
    .where(eq(user.username, "Corbin"))
    .then((data) => data.at(0));
  console.log("43");

  if (!corbinExists) {
    console.log("52");
    const tokenRes = await db
      .insert(token)
      .values({
        value: await getHash({ str: crypto.randomUUID() }),
      })
      .returning()
      .then((data) => data[0]);
    console.log("60");
    await db.insert(user).values({
      password: await getHash({ str: crypto.randomUUID() }),
      username: "Corbin",
      displayName: "Corbin Borgle",
      token: tokenRes.value,
      id: "ai-corbin",
    });
    console.log("61");
  }

  await drizzleSql.end();
  console.log("63");
  process.exit(0);
})();
