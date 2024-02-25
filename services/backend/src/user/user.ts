import { db } from "@fireside/db";
import { user } from "@fireside/db/src/schema";
import { Elysia, t } from "elysia";

export const userRoute = new Elysia({
  prefix: "/user",
}).post(
  "/create",
  async (ctx) => {
    const newUserRes = await db
      .insert(user)
      .values({
        displayName: ctx.body.displayName,
        email: "dont matta",
        password: "what?",
        token: "beboop",
        role: "student",
      })
      .returning();

    return newUserRes[0];
  },
  {
    body: t.Object({
      displayName: t.String(),
    }),
  }
);
