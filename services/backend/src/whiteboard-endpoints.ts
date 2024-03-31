import {
  eq,
  whiteBoard,
  whiteBoardInsertSchema,
  whiteBoardPoint,
  whiteBoardPointGroup,
  type WhiteBoardPoint,
  type WhiteBoardColors,
} from "@fireside/db";
import { ProtectedElysia } from "./lib";
import { db } from ".";
import { t } from "elysia";
import { run } from "@fireside/utils";
export type TransformedWhiteBoardPointGroup = Omit<
  WhiteBoardPoint,
  "whiteBoardPointGroupId"
> & { color: WhiteBoardColors };
export const whiteboardRoute = ProtectedElysia({ prefix: "/whiteboard" })
  .post(
    "/create",
    async () => (await db.insert(whiteBoard).values({}).returning())[0],
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
    message: (ws) => {},
  });

// export type PublishedPoints = {
//   x: number
// }
