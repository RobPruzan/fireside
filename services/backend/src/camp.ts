import {
  camp,
  campMembers,
  campMembersWithoutUserInsertSchema,
  campSchema,
} from "@fireside/db";
import { ProtectedElysia } from "./lib";
import { db } from ".";

export const campRouter = ProtectedElysia({ prefix: "/camp" })
  .post("/create", ({ body }) => db.insert(camp).values(body), {
    body: campSchema,
  })
  .post(
    "/join",
    ({ body, user }) =>
      db.insert(campMembers).values({ ...body, userId: user.id }),
    {
      body: campMembersWithoutUserInsertSchema,
    }
  );
