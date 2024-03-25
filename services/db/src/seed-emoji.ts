import { eq } from "drizzle-orm";
import { createDB } from "./db";
import { emojis, reactionAsset } from "./schema";

(async () => {
  const { db, sql } = createDB({
    connString: process.env.CONNECTION_STRING,
  });

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

  sql.end();
})();
