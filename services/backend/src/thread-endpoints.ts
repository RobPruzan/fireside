import {
  camp,
  campMessage,
  campThread,
  campThreadInsertSchema,
  campThreadMessage,
  campThreadMessageInsertSchema,
  eq,
  getTableColumns,
  user,
} from "@fireside/db";
import { ProtectedElysia } from "./lib";
import { db } from ".";
import { t } from "elysia";
import { cleanedUserCols } from "./camp-endpoints";

export const threadRouter = ProtectedElysia({ prefix: "/thread" })
  .post(
    "/create/:parentMessageId",
    async (ctx) => {
      const thread = (
        await db
          .insert(campThread)
          .values({
            createdBy: ctx.user.id,
            parentMessageId: ctx.params.parentMessageId,
          })
          .returning()
      )[0];

      const campId = (
        await db
          .select()
          .from(campMessage)
          .where(eq(campMessage.id, thread.parentMessageId))
      )[0].campId;

      return {
        ...thread,
        campId,
      };
    },
    {
      params: t.Pick(campThreadInsertSchema, ["parentMessageId"]),
    }
  )
  .post(
    "/:threadId/message/create",
    (ctx) =>
      db.insert(campThreadMessage).values({
        ...ctx.body,
        userId: ctx.user.id,
        threadId: ctx.params.threadId,
      }),
    {
      body: t.Omit(campThreadMessageInsertSchema, ["threadId"]),
      params: t.Pick(campThreadMessageInsertSchema, ["threadId"]),
    }
  )
  .get(
    "/:threadId/message/retrieve",
    (ctx) =>
      db
        .select({
          ...getTableColumns(campThreadMessage),
          user: cleanedUserCols,
        })
        .from(campThreadMessage)
        .innerJoin(user, eq(user.id, campThreadMessage.userId))
        .where(eq(campThreadMessage.threadId, ctx.params.threadId)),
    {
      params: t.Object({
        threadId: t.String(),
      }),
    }
  )
  .get(
    "/retrieve/:campId",
    (ctx) =>
      db
        .select({
          ...getTableColumns(campThread),
          campId: campMessage.campId,
        })
        .from(campThread)
        .innerJoin(campMessage, eq(campMessage.id, campThread.parentMessageId))
        .where(eq(campMessage.campId, ctx.params.campId)),
    {
      params: t.Object({
        campId: t.String(),
      }),
    }
  );
