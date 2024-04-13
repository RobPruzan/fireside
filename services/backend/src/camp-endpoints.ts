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
} from "@fireside/db";
import { ProtectedElysia } from "./lib";
import { db } from ".";
import { t } from "elysia";

export const getAudioRoom = ({
  broadcasterId,
  campId,
  receiverId,
}: {
  campId: string;
  broadcasterId: string;
  receiverId: string;
}) => `audio/${campId}/${broadcasterId}/${receiverId}`;

export const campRouter = ProtectedElysia({ prefix: "/camp" })
  .get(
    "/retrieve/:campId",
    async ({ params }) =>
      (await db.select().from(camp).where(eq(camp.id, params.campId)))[0],
    {
      params: t.Object({
        campId: t.String(),
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
  })
  .ws("/audio/:campId", {
    message: async (ws, data) => {
      // if ((data as { kind: string }).kind === "join-channel") {
      //   ws.subscribe(
      //     getAudioRoom({
      //       broadcasterId: (data as { broadcasterId: string }).broadcasterId,
      //       campId: ws.data.params.campId,
      //       receiverId: ws.data.user.id,
      //     })
      //   );
      //   return;
      // }

      const targetCamp = (
        await db.select().from(camp).where(eq(camp.id, ws.data.params.campId))
      )[0];
      const broadcaster = (
        await db
          .select()
          .from(user)
          .where(eq(user.id, (data as { broadcasterId: string }).broadcasterId))
      )[0];
      const receiver = (
        await db
          .select()
          .from(user)
          .where(eq(user.id, (data as { receiverId: string }).receiverId))
      )[0];

      if ((data as { kind: string }).kind === "join-channel-request") {
        console.log(
          // ws.data.user.email,
          "joined:",
          `${targetCamp.name}/${broadcaster.email}/${receiver.email}`,
          `is broadcaster? ${broadcaster.id === ws.data.user.id}`
          // "joined channel",

          // getAudioRoom({
          //   broadcasterId: (data as { broadcasterId: string }).broadcasterId,
          //   campId: ws.data.params.campId,
          //   receiverId: (data as { receiverId: string }).receiverId,
          // })
        );
        // ws.publish(`audio-${ws.data.params.campId}`);
        ws.subscribe(
          getAudioRoom({
            broadcasterId: (data as { broadcasterId: string }).broadcasterId,
            campId: ws.data.params.campId,
            receiverId: (data as { receiverId: string }).receiverId,
          })
        );
        // return;
      }

      if ((data as { kind: string }).kind === "leave-channel-request") {
        ws.unsubscribe(
          getAudioRoom({
            broadcasterId: (data as { broadcasterId: string }).broadcasterId,
            campId: ws.data.params.campId,
            receiverId: (data as { receiverId: string }).receiverId,
          })
        );
      }

      // ws.send
      // console.log(data);
      // if (data.kind ===)
      // console.log(
      //   "sending to",
      //   getAudioRoom({
      //     broadcasterId: (data as { broadcasterId: string }).broadcasterId,
      //     campId: ws.data.params.campId,
      //     receiverId: ws.data.user.id,
      //   })
      //   // {
      //   //   ...(data as any),
      //   //   userId: ws.data.user.id,
      //   // }
      // );

      // if (data.kind === "webRTC-answer") {
      //   console.log('ans location',
      //     getAudioRoom({
      //       broadcasterId: (data as { broadcasterId: string }).broadcasterId,
      //       campId: ws.data.params.campId,
      //       receiverId: (data as { receiverId: string }).receiverId,
      //     })
      //   );
      // }

      ws.publish(
        getAudioRoom({
          broadcasterId: (data as { broadcasterId: string }).broadcasterId,
          campId: ws.data.params.campId,
          receiverId: (data as { receiverId: string }).receiverId,
        }),
        {
          ...(data as any),
          userId: ws.data.user.id,
        }
      );
    },
    open: (ws) => {
      console.log("joined", ws.data.user.email);
      ws.subscribe(`audio-${ws.data.params.campId}`);

      ws.publish(`audio-${ws.data.params.campId}`, {
        kind: "user-joined",
        userId: ws.data.user.id,
      });
    },
    close: (ws) => {
      ws.publish(`audio-${ws.data.params.campId}`, {
        kind: "user-left",
        userId: ws.data.user.id,
      });

      // ws.unsubscribe(getAudioRoom({broadcasterId}))
    },
    params: t.Object({
      campId: t.String(),
    }),
    body: t.Unknown(),
    // body: t.Union([
    //   t.Object({ kind: t.Literal("webRTC-offer"), offer: t.Unknown() }),
    //   t.Object({ kind: t.Literal("webRTC-candidate"), candidate: t.Unknown() }),
    //   t.Object({ kind: t.Literal("webRTC-answer"), answer: t.Unknown() }),
    // ]),
  });

export const {
  token: tk,
  password: pwd,
  ...cleanedUserCols
} = getTableColumns(user);
// const getCampsWithCount = ({}:{campId:string,camMember}) => {}
//
