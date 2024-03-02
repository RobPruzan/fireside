import {
    user,
    eq,
    token,
    getOneYearAheadDate,
    count,
    type User,
    chatDB,
  } from "@fireside/db";
  
  import { Elysia, t, type CookieOptions } from "elysia";
  import { uuid } from "drizzle-orm/pg-core";
  import { ProtectedElysia } from "./lib";
   

export const messageRoute = ProtectedElysia({
    prefix:"/message",
})

.post(
    "/chat",
    async (ctx) => {
        if(ctx){
        const userID = uuid("userId").references(()=> user.id);
      
        await db
            .insert(chatDB)
            .values({
                // id: db.select(""),
                roomName : "Default",
                userId:userID,
                chatMessage : ctx.request.body
            })

        }
    },
    {
        body: t.Object({
            message: t.String(),
        })
    }
  );

