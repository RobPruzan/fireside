import {
    db,
    user,
    eq,
    token,
    getOneYearAheadDate,
    count,
    type User,
    chatDB,
  } from "@fireside/db";
  
  import { Elysia, t, type CookieOptions } from "elysia";
  import { routerWithSession, authHandle } from "./lib";
  import { uuid } from "drizzle-orm/pg-core";
  import { ProtectedElysia } from "./lib";

export const messageRoute = ProtectedElysia({
  prefix: "/message",
})


.post(
    "/chat",
    async (ctx) => {
      const userID = uuid("userId").references(()=> user.id);
      
      await db
        .insert(chatDB)
        .values({
            roomName : "Default",
            userId:userID,
            chatMessage : ctx.body.message
        })

     
      ctx.body = "Chat message posted successfully";
    }
  );

