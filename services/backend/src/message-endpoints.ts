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
  reactionAsset,
  campThread,
  requiredCampMessageInsertSchema,
  requiredThreadInsertSchema,
} from "@fireside/db";
import { t, type Static } from "elysia";
import { db } from ".";
import { cleanedUserCols } from "./camp-endpoints";
import { ProtectedElysia } from "./lib";

export const messageRouter = ProtectedElysia({ prefix: "/message" })
  .get(
    "/retrieve/:campId",
    async ({ params }) => {
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
    "/react/:reactionAssetId/:messageId",
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
          (reaction) => reaction.reactionAssetId === ctx.params.reactionAssetId
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
        reactionAssetId: ctx.params.reactionAssetId,
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
  .get("/assets/react", () => db.select().from(reactionAsset))
  .post(
    "/react/remove/:reactionId",
    (ctx) =>
      db
        .delete(userMessageReaction)
        .where(eq(userMessageReaction.id, ctx.params.reactionId)),
    {
      params: t.Object({
        reactionId: t.String(),
      }),
    }
  )
  .ws("/ws/:campId", {
    body: t.Object({
      message: requiredCampMessageInsertSchema,
      thread: requiredThreadInsertSchema,
    }),
    params: t.Object({
      campId: t.String(),
    }),
    open: (ws) => {
      ws.subscribe(`camp-${ws.data.params.campId}`);
    },
    close: (ws) => {
      ws.unsubscribe(`camp-${ws.data.params.campId}`);
    },
    message: async (ws, data) => {
      // message must exist before the thread is created
      await db
        .insert(campMessage)
        .values({ ...data.message, userId: ws.data.user.id });

      await db
        .insert(campThread)
        .values({ ...data.thread, createdBy: ws.data.user.id });

      ws.publish(`camp-${ws.data.params.campId}`, data);
    },
  });

export type UserConnectedToCamp = {
  userId: string;
  joinedAt: string;
};

const publishMessageSchema = t.Object({
  message: requiredCampMessageInsertSchema,
  thread: requiredThreadInsertSchema,
});

export type PublishedMessage = Static<typeof publishMessageSchema>;
