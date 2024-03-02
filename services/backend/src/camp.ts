import {
  camp,
  campMembers,
  campMembersWithoutUserInsertSchema,
  campSchema,
  user,
  eq,
} from "@fireside/db";
import { ProtectedElysia } from "./lib";
import { db } from ".";

export const campRouter = ProtectedElysia({ prefix: "/camp" })
  .post(
    "/create",
    async ({ body }) => (await db.insert(camp).values(body).returning())[0],
    {
      body: campSchema,
    }
  )
  .post(
    "/join",
    ({ body, user }) =>
      db
        .insert(campMembers)
        .values({ ...body, userId: user.id })
        .returning(),
    {
      body: campMembersWithoutUserInsertSchema,
    }
  )
  .get("/retrieve", async () => await db.select().from(camp));
