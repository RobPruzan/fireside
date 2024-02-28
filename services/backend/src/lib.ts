import type { StatusMap } from "@fireside/utils/src/constants";
import { Elysia } from "elysia";
import { getSession } from "./user";

export const routerWithSession = <T extends string>({
  prefix,
}: {
  prefix: T;
}) =>
  new Elysia({ prefix: `/protected/${prefix}` }).derive(
    async ({ cookie: { auth } }) => {
      const session = await getSession({ authToken: auth.get() });
      return { session };
    }
  );

export const authHandle = async ({
  session,
  set,
}: {
  set: { status?: number | keyof typeof StatusMap };
  session: ReturnType<typeof getSession> extends Promise<infer R>
    ? R
    : "L bozo once again";
}) => {
  if (session.kind === "not-logged-in") {
    return (set.status = "Unauthorized");
  }
};
