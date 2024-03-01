import {
  camp,
  campMembers,
  campMembersWithoutUserSchema,
  campSchema,
  db,
} from "@fireside/db";
import { ProtectedElysia } from "./lib";

export const campRouter = ProtectedElysia({ prefix: "/camp" })
  .post("/create", ({ body }) => db.insert(camp).values(body), {
    body: campSchema,
  })
  .post(
    "/join",
    ({ body, user }) =>
      db.insert(campMembers).values({ ...body, user_id: user.id }),
    {
      body: campMembersWithoutUserSchema,
    }
  );