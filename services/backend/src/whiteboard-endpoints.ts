import {
  eq,
  whiteBoard,
  whiteBoardInsertSchema,
  whiteBoardPoint,
  whiteBoardPointGroup,
  type WhiteBoardPoint,
  type WhiteBoardColor,
} from "@fireside/db";
import { ProtectedElysia } from "./lib";
import { db } from ".";
import { t, type Static } from "elysia";
import { run } from "@fireside/utils";
export type TransformedWhiteBoardPointGroup = WhiteBoardPoint & {
  color: WhiteBoardColor;
};
export const whiteboardRoute = ProtectedElysia({ prefix: "/whiteboard" })
  .post(
    "/create",
    async ({ body }) => {
      // if (body.id) {
      //   const existingBoard = await db
      //     .select()
      //     .from(whiteBoard)
      //     .where(eq(whiteBoard.id, body.id));

      //   if (existingBoard.at(0)) {
      //     return;
      //   }
      // }

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

      // const pointGroups: Array<Array<WhiteBoardPoint>> =
      //   Object.values(pointGroupToPoints);

      return Object.values(pointGroupToPoints);
    },
    // .from(whiteBoard)

    // .where(eq(whiteBoard.id, params.whiteBoardId))
    // .fullJoin(
    //   whiteBoa,
    //   eq(whiteBoardPoint.whiteBoardId, whiteBoard.id)
    // ),
    { params: t.Object({ whiteBoardId: t.String() }) }
  )
  .ws("/ws/:whiteBoardId", {
    params: t.Object({
      whiteBoardId: t.String(),
    }),
    body: t.Object({
      id: t.String(),
      whiteBoardId: t.String(),
      whiteBoardPointGroupId: t.String(),
      x: t.Number(),
      y: t.Number(),
      color: t.String(),
    }),
    open: (ws) => {
      console.log(
        "joined white board",
        `white-board-${ws.data.params.whiteBoardId}`
      );
      ws.subscribe(`white-board-${ws.data.params.whiteBoardId}`);
    },
    message: async (ws, data) => {
      // console.log("recieved", data);

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

      console.log("publishing", data.id);
      ws.publish(`white-board-${ws.data.params.whiteBoardId}`, data);
    },
    close: (ws) => {
      ws.unsubscribe(`white-board-${ws.data.params.whiteBoardId}`);
    },
  });

// export type PublishedPoints = {
//   x: number
// }

const whiteBoardBodySchema = t.Object({
  id: t.String(),
  whiteBoardId: t.String(),
  whiteBoardPointGroupId: t.String(),
  x: t.Number(),
  y: t.Number(),
  color: t.String(),
});

export type PublishedWhiteBoardPoint = Omit<
  Static<typeof whiteBoardBodySchema>,
  "color"
> & { color: WhiteBoardColor };
