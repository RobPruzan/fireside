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

export const campRouter = ProtectedElysia({ prefix: "/camp" })
  .get(
    "/message/retrieve/:campId",
    async ({ params }) => {
      return db
        .select()
        .from(campMessage)
        .where(eq(campMessage.campId, params.campId));
    },
    {
      params: t.Object({
        campId: t.String(),
      }),
    }
  )

  .post(
    "/message/create",
    async ({ user, body }) => {
      return (
        await db
          .insert(campMessage)
          .values({ ...body, userId: user.id })
          .returning()
      )[0];
    },
    {
      body: campMessageInsertSchema,
    }
  )
  
  .post(
    "/message/like",
    async ({user,body}) => {
      const { messageId } = body;

      //Getting the exisiting likes from the database
      const existingLike = await db
        .select()
        .from(campMessageLikes)
        .where(and(eq(campMessageLikes.userId, user.id), eq(campMessageLikes.messageId, messageId)));
      
      //if the user has already liked the specific post
      if(existingLike.length > 0){  
        await db
        .delete(campMessageLikes)
        .where(and(eq(campMessageLikes.userId, user.id), eq(campMessageLikes.messageId, messageId)));
      }else{//If the user hasnt liked the post yet then add them to the database
        await db
        .insert(campMessageLikes)
        .values({ userId: user.id, messageId })
        .returning();
      }
      
    },
    {
      body: t.Object({
        campId: t.String(),
        messageId: t.String()
      }),
    }

  )

  .get(
    "/message/like",
    async ({user,body}) => {
      
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

const { token: tk, password: pwd, ...cleanedUserCols } = getTableColumns(user);
// const getCampsWithCount = ({}:{campId:string,camMember}) => {}
