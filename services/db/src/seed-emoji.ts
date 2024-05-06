import { eq } from "drizzle-orm";

import { emojis, reactionAsset } from "./schema";
import { db, drizzleSql, migratingFlag } from "./db";
migratingFlag.current = true;

(async () => {
  await Promise.all(
    emojis.map(async (emoji) => {
      const hasEmoji = (
        await db
          .select()
          .from(reactionAsset)
          .where(eq(reactionAsset.alt, emoji.alt))
      ).at(0);

      if (hasEmoji) {
        await drizzleSql.end();
        return;
      }

      return db.insert(reactionAsset).values({
        alt: emoji.alt,
        imgSrc: emoji.src,
      });
    })
  );

  await drizzleSql.end();
})();
