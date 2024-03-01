import type { StatusMap } from "@fireside/utils/src/constants";
import { Elysia } from "elysia";
import { getSession } from "./user";

// export const routerWithSession = <T>({ prefix }: { prefix: T }) =>
//   new Elysia({ prefix: `/protected/${prefix}` }).resolve(
//     async ({ cookie: { auth } }) => {
//       console.log("route");
//       const session = await getSession({ authToken: auth.get() });
//       // console.log(session);
//       // return { session };
//     }
//   );

export const authHandle = async ({
  session,
  set,
}: {
  set: { status?: number | keyof typeof StatusMap };
  session: ReturnType<typeof getSession> extends Promise<infer R>
    ? R
    : "L bozo once again";
}) => {
  console.log("auth handle", session);
  if (session.kind === "not-logged-in") {
    return (set.status = "Unauthorized");
  }
};
