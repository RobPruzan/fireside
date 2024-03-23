import {
  camp,
  campMember,
  campMembersWithoutUserInsertSchema,
  campSchema,
  user,
  eq,
  getTableColumns,
  count,
  sql,
  and,
  campMessageInsertSchema,
  campMessage,
  campMessageLikes,
} from "@fireside/db";
import { ProtectedElysia } from "./lib";
import { db } from ".";
import { t } from "elysia";
//random Comment
export const campRouter = ProtectedElysia({ prefix: "/camp" })
  .get(
    "/message/retrieve/:campId",
    async ({ params }) => {
      console.log("hit 2");
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
    "/message/create",
    async (ctx) => {
      const newMessage = (
        await db
          .insert(campMessage)
          .values({ ...ctx.body, userId: ctx.user.id })
          .returning()
      )[0];
      console.log("hit");
      return (
        await db
          .select({
            ...getTableColumns(campMessage),
            user: cleanedUserCols,
          })
          .from(campMessage)
          .where(eq(campMessage.id, newMessage.id))
          .innerJoin(user, eq(campMessage.userId, user.id))
      )[0];
    },
    {
      body: campMessageInsertSchema,
    }
  )
  
  .post(
    "/message/like",
    async ({ user, body }) => {
      const { messageId } = body;
  
      // Getting the existing likes from the database
      const existingLikes = await db
        .select()
        .from(campMessageLikes)
        .where(and(eq(campMessageLikes.userId, user.id), eq(campMessageLikes.messageId, messageId)));
  
      let totalLikes = 0;
  
      // If the user has already liked the specific post
      if (existingLikes.length > 0) {
        // Unlike the post
        await db
          .delete(campMessageLikes)
          .where(and(eq(campMessageLikes.userId, user.id), eq(campMessageLikes.messageId, messageId)));
      } else {
        // Like the post
        await db
          .insert(campMessageLikes)
          .values({ userId: user.id, messageId })
          .returning();
  
        // Calculate total likes by counting the length of existingLikes array
        totalLikes = existingLikes.length;
      }
  
      // Return total likes
      return { totalLikes };
    },
    {
      body: t.Object({
        campId: t.String(),
        messageId: t.String()
      }),
    }
  )


  .post(
    "/create",
    async ({ body, user }) => {
      const createdCamp = (await db.insert(camp).values(body).returning())[0];

      const createdCampMemberCount =
        (
          await db
            .select({ count: count() })
            .from(campMember)
            .where(eq(campMember.campId, createdCamp.id))
        )[0].count + 1;

      const createdCampMember = (
        await db
          .insert(campMember)
          .values({
            campId: createdCamp.id,
            userId: user.id,
          })
          .returning()
      )[0];

      return {
        ...createdCamp,
        count: createdCampMemberCount,
        campMember: createdCampMember,
        user,
      };
    },
    {
      body: campSchema,
    }
  )
  .post(
    "/join/:campId",
    async ({ params, user, set }) => {
      const existingCamp = (
        await db
          .select()
          .from(campMember)
          .where(
            and(
              eq(campMember.userId, user.id),
              eq(campMember.campId, params.campId)
            )
          )
      ).at(0);
      if (existingCamp) {
        set.status = 409;
        throw new Error("Already in camp");
      }
      const newCampMember = (
        await db
          .insert(campMember)
          .values({ campId: params.campId, userId: user.id })
          .returning()
      )[0];

      const joinedCamp = (
        await db.select().from(camp).where(eq(camp.id, newCampMember.campId))
      )[0];

      return { ...joinedCamp, user, campMember: newCampMember };
    },
    {
      params: t.Object({
        campId: t.String(),
      }),
    }
  )
  .get("/retrieve/me", (ctx) =>
    db
      .select({
        ...getTableColumns(camp),
        user: cleanedUserCols,
        campMember: getTableColumns(campMember),
      })
      .from(campMember)
      .innerJoin(camp, eq(camp.id, campMember.campId))
      .innerJoin(user, eq(campMember.userId, user.id))
      .where(eq(campMember.userId, ctx.user.id))
  )
  .get("/retrieve", async () => {
    const res = await db
      .select({
        ...getTableColumns(camp),
        count: sql<number>`cast(count(${campMember.campId}) as int)`,
      })
      .from(camp)
      .leftJoin(campMember, eq(camp.id, campMember.campId))
      .groupBy(camp.id);

    return res;
  });

export const {
  token: tk,
  password: pwd,
  ...cleanedUserCols
} = getTableColumns(user);
// const getCampsWithCount = ({}:{campId:string,camMember}) => {}
