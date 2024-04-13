import {
  eq,
  whiteBoard,
  whiteBoardInsertSchema,
  whiteBoardPoint,
  whiteBoardPointGroup,
  type WhiteBoardPoint,
  type WhiteBoardColor,
  whiteBoardPointInsertSchema,
  whiteBoardMouseInsertSchema,
  whiteBoardMouse,
  whiteBoardMouseSelectSchema,
  and,
  not,
  user,
  getTableColumns,
  type User,
  safeUserSelectSchema,
  messageWhiteBoardSchema,
  messageWhiteBoard,
  whiteBoardImg,
} from "@fireside/db";
import { ProtectedElysia } from "./lib";
import { db } from ".";
import { t, type Static } from "elysia";
import { run } from "@fireside/utils";
import { cleanedUserCols } from "./camp-endpoints";
import { writeFile } from "fs";
import type { BunFile } from "bun";
export type TransformedWhiteBoardPointGroup = WhiteBoardPoint & {
  color: WhiteBoardColor;
};
const extensionMapping: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/bmp": ".bmp",
  "image/svg+xml": ".svg",
  "image/webp": ".webp",
};
// export const
const whiteBoardBodySchema = t.Object({
  id: t.String(),
  whiteBoardId: t.String(),
  whiteBoardPointGroupId: t.String(),
  x: t.Number(),
  y: t.Number(),
  color: t.String(),
  kind: t.Literal("point"),
});

const messageBodySchema = t.Union([
  whiteBoardBodySchema,
  t.Intersect([
    whiteBoardMouseSelectSchema,
    t.Object({
      user: t.Object({
        id: t.String(),
        email: t.String(),
        displayName: t.String(),
      }),
    }),
  ]),
]);

export type WhiteBoardPublish =
  | (Static<typeof whiteBoardMouseSelectSchema> & {
      user: Omit<User, "password" | "token">;
    })
  | (Omit<Static<typeof whiteBoardBodySchema>, "color"> & {
      color: WhiteBoardColor;
    });
// export type PublishedWhiteBoardPoint = Omit<
//   Static<typeof whiteBoardBodySchema>,
//   "color"
// > & { color: WhiteBoardColor };

export const whiteboardRoute = ProtectedElysia({ prefix: "/whiteboard" })
  .post(
    "/create",
    async ({ body }) => {
      return (
        await db
          .insert(whiteBoard)
          .values(body)
          .onConflictDoNothing()
          .returning()
      )[0];
    },
    {
      body: whiteBoardInsertSchema,
    }
  )
  .get("/retrieve", () => db.select().from(whiteBoard))
  .get(
    "/retrieve/:whiteBoardId",
    async ({ params }) => {
      const res = await db
        .select()
        .from(whiteBoardPointGroup)
        .innerJoin(
          whiteBoardPoint,
          eq(whiteBoardPointGroup.id, whiteBoardPoint.whiteBoardPointGroupId)
        )
        .where(eq(whiteBoardPointGroup.whiteBoardId, params.whiteBoardId));

      const pointGroupToPoints: Record<
        string,
        Array<TransformedWhiteBoardPointGroup>
      > = {};

      res.forEach(({ whiteBoardPoint, whiteBoardPointGroup }) => {
        pointGroupToPoints[whiteBoardPointGroup.id] = run(() => {
          const point = {
            ...whiteBoardPoint,
            color: whiteBoardPointGroup.color,
          };
          if (pointGroupToPoints[whiteBoardPointGroup.id]) {
            return [...pointGroupToPoints[whiteBoardPointGroup.id], point];
          }
          return [point];
        });
      });

      return Object.values(pointGroupToPoints);
    },

    { params: t.Object({ whiteBoardId: t.String() }) }
  )
  .get(
    "/mouse/retrieve/:whiteBoardId",
    async (ctx) => {
      const mousePoints = await db
        .select({
          ...getTableColumns(whiteBoardMouse),
          user: cleanedUserCols,
        })
        .from(whiteBoardMouse)
        .where(
          and(
            eq(whiteBoardMouse.whiteBoardId, ctx.params.whiteBoardId),
            not(eq(whiteBoardMouse.userId, ctx.user.id))
          )
        )
        .innerJoin(user, eq(user.id, whiteBoardMouse.userId));

      const dedupedIds = new Set<string>();

      mousePoints.forEach(({ userId }) => {
        dedupedIds.add(userId);
      });

      // [...(dedupedIds.values())]

      const newMousePoints = [...dedupedIds].map(
        (userId) => mousePoints.find((mouse) => mouse.userId === userId)!
      );

      return newMousePoints;
    },

    { params: t.Object({ whiteBoardId: t.String() }) }
  )
  .post(
    "/message/create",
    ({ body }) => db.insert(messageWhiteBoard).values(body),
    {
      body: messageWhiteBoardSchema,
    }
  )
  .get("/message/retrieve/:campId", () => db.select().from(messageWhiteBoard), {
    params: t.Object({
      campId: t.String(),
    }),
  })
  .ws("/ws/:whiteBoardId", {
    params: t.Object({
      whiteBoardId: t.String(),
    }),
    body: messageBodySchema,
    open: (ws) => {
      ws.subscribe(`white-board-${ws.data.params.whiteBoardId}`);
    },
    message: async (ws, data) => {
      switch (data.kind) {
        case "point": {
          const existingGroup = await db
            .select()
            .from(whiteBoardPointGroup)
            .where(eq(whiteBoardPointGroup.id, data.whiteBoardPointGroupId));
          if (existingGroup.length === 0) {
            await db
              .insert(whiteBoardPointGroup)
              .values({
                color: data.color as WhiteBoardColor,
                whiteBoardId: data.whiteBoardId,
                id: data.whiteBoardPointGroupId,
              })
              .onConflictDoNothing();
          }
          await db
            .insert(whiteBoardPoint)
            .values({
              x: data.x,
              y: data.y,
              id: data.id,
              whiteBoardPointGroupId: data.whiteBoardPointGroupId,
            })
            .onConflictDoNothing();

          ws.publish(`white-board-${ws.data.params.whiteBoardId}`, data);

          return;
        }
        case "mouse": {
          const existingMousePoint = (
            await db
              .select()
              .from(whiteBoardMouse)
              .where(
                and(
                  eq(whiteBoardMouse.userId, ws.data.user.id),
                  eq(whiteBoardMouse.whiteBoardId, ws.data.params.whiteBoardId)
                )
              )
          ).at(0);

          if (existingMousePoint) {
            await db
              .update(whiteBoardMouse)
              .set({
                x: data.x,
                y: data.y,
              })
              .where(eq(whiteBoardMouse.id, existingMousePoint.id));
          } else {
            await db.insert(whiteBoardMouse).values(data);
          }
          ws.publish(`white-board-${ws.data.params.whiteBoardId}`, data);
        }
      }
    },
    close: (ws) => {
      ws.unsubscribe(`white-board-${ws.data.params.whiteBoardId}`);
    },
  })
  //
  .post(
    "/whiteboard-image/upload/:whiteBoardId",
    async (ctx) => {
      const imageId = crypto.randomUUID();
      const extension = extensionMapping[ctx.body.whiteBoardImg.type];
      console.log("create file object");
      const file = Bun.file(`./upload/${imageId}${extension}`);

      if (!file.type.includes("image")) {
        ctx.error("Bad Request");
        return;
      }
      console.log("writing file object");
      await Bun.write(file, ctx.body.whiteBoardImg);
      console.log("finished writing");
      const newImg = await db
        .insert(whiteBoardImg)
        .values({
          imgUrl: process.env.API_URL + `/upload/${imageId}${extension}`,
          id: imageId,
          whiteBoardId: ctx.params.whiteBoardId,
          x: Number(ctx.body.x),
          y: Number(ctx.body.y),
        })
        .returning();
      return newImg[0];
    },

    {
      type: "multipart/form-data",
      params: t.Object({
        whiteBoardId: t.String(),
      }),
      body: t.Object({
        whiteBoardImg: t.File(),
        x: t.String(),
        y: t.String(),
      }),
    }
  )
  .get(
    "/whiteboard-image/retrieve/:whiteBoardId",
    ({ params }) =>
      db
        .select()
        .from(whiteBoardImg)
        .where(eq(whiteBoardImg.whiteBoardId, params.whiteBoardId)),
    {
      params: t.Object({
        whiteBoardId: t.String(),
      }),
    }
  );
