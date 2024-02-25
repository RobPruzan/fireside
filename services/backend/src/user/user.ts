import { db } from "@fireside/db";
import { user } from "@fireside/db/src/schema";
import { Elysia, t } from "elysia";

export const userRoute = new Elysia({
  prefix: "/user",
}).post(
  "/create",
  async (ctx) => {
    await db.insert(user).values({ name: ctx.body.name, email: "dont matta" });
    console.log('hi')
  },
  {
    body: t.Object({
      name: t.String(),
    }),
  }
);
