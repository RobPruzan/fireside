import {
    user,
    eq,
    token,
    getOneYearAheadDate,
    count,
    type User,
    chatDB,
  } from "@fireside/db";

  import {db} from ".";
  import { Elysia, t, type CookieOptions } from "elysia";
  import { uuid } from "drizzle-orm/pg-core";
  import { ProtectedElysia } from "./lib";

   

export const messageRoute = ProtectedElysia({
    prefix:"/message",
})

.post(
    "/chat",
    async (ctx) => {
      if (ctx.request.body && typeof ctx.body.chatMessage === 'string' && typeof ctx.body.userId === 'string') {
        await db
          .insert(chatDB)
          .values({
            roomName: ctx.body.roomName,
            userId: ctx.body.userId,
            chatMessage: ctx.body.chatMessage
          });
      }
    },
    {
      body: t.Object({
        userId: t.String(),
        roomName: t.String(),
        chatMessage: t.String(),
      })
    }
  );