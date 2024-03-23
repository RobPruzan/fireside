import {
  getTableColumns,
  campMessage,
  eq,
  user,
  campMessageInsertSchema,
  count,
  userMessageReaction,
  and,
  userMessageReactionInsertSchema,
  reaction,
} from "@fireside/db";
import { t } from "elysia";
import { db } from ".";
import { cleanedUserCols } from "./camp-endpoints";
import { ProtectedElysia } from "./lib";

export const messageRouter = ProtectedElysia({ prefix: "/message" })
  .get(
    "/retrieve/:campId",
    async ({ params }) => {
      console.log("hit 2");
      return db
        .select({
          ...getTableColumns(campMessage),
          user: cleanedUserCols,
        })
        .from(campMessage)
        .where(eq(campMessage.campId, params.campId))
        .innerJoin(user, eq(user.id, campMessage.userId));
    },
    {
      params: t.Object({
        campId: t.String(),
      }),
    }
  )

  .post(
    "/create",
    async (ctx) => {
      const newMessage = (
        await db
          .insert(campMessage)
          .values({ ...ctx.body, userId: ctx.user.id })
          .returning()
      )[0];
      console.log("hit");
      return (
        await db
          .select({
            ...getTableColumns(campMessage),
            user: cleanedUserCols,
          })
          .from(campMessage)
          .where(eq(campMessage.id, newMessage.id))
          .innerJoin(user, eq(campMessage.userId, user.id))
      )[0];
    },
    {
      body: campMessageInsertSchema,
    }
  )
  .post(
    "/react/:reactionId/:messageId",
    async (ctx) => {
      const userReactionsOnMessage = await db
        .select()
        .from(userMessageReaction)
        .where(
          and(
            eq(userMessageReaction.messageId, ctx.params.messageId),
            eq(userMessageReaction.userId, ctx.user.id)
          )
        );

      if (
        userReactionsOnMessage.some(
          (reaction) => reaction.reactionId === ctx.params.reactionId
        )
      ) {
        throw ctx.error("Bad Request");
      }
      // need special logic for unliking on dislike later
      // if (userReactionsOnMessage.some(reaction => ))

      // const hasDislikedQuery = (await db.select().from(userMessageReaction))

      return db.insert(userMessageReaction).values({
        messageId: ctx.params.messageId,
        userId: ctx.user.id,
        reactionId: ctx.params.reactionId,
        id: ctx.body.id,
      });
    },
    {
      params: userMessageReactionInsertSchema,
      body: t.Pick(userMessageReactionInsertSchema, ["id"]),
    }
  )
  .get(
    "/react/retrieve/:campId",
    (ctx) =>
      db
        .select({
          ...getTableColumns(userMessageReaction),
          campId: campMessage.campId,
        })
        .from(userMessageReaction)
        .innerJoin(
          campMessage,
          eq(campMessage.id, userMessageReaction.messageId)
        )
        .where(eq(campMessage.campId, ctx.params.campId)),
    {
      params: t.Object({
        campId: t.String(),
      }),
    }
  )
  .get("/assets/react", () => db.select().from(reaction));
