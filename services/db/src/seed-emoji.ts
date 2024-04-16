import { eq } from "drizzle-orm";

import { emojis, reactionAsset } from "./schema";
import { db, drizzleSql } from "./db";

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
        return;
      }

      return db.insert(reactionAsset).values({
        alt: emoji.alt,
        imgSrc: emoji.src,
      });
    })
  );

  drizzleSql.end();
})();
