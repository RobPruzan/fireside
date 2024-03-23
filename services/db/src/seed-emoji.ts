import { eq } from "drizzle-orm";
import { createDB } from "./db";
import { emojis, reaction } from "./schema";

(async () => {
  const { db, sql } = createDB();

  await Promise.all(
    emojis.map(async (emoji) => {
      const hasEmoji = (
        await db.select().from(reaction).where(eq(reaction.alt, emoji.alt))
      ).at(0);

      if (hasEmoji) {
        return;
      }

      return db.insert(reaction).values({
        alt: emoji.alt,
        imgSrc: emoji.src,
      });
    })
  );

  sql.end();
})();
