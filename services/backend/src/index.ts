import cors from "@elysiajs/cors";
import { db } from "@fireside/db";
import { user } from "@fireside/db/src/schema";
import { Elysia } from "elysia";
import { getDeleteAuthCookie, getSession, userRoute } from "./user";

const authProtectedRoute = new Elysia({ prefix: "/protected" })
  .derive(async ({ cookie: { auth } }) => {
    const session = await getSession({ authToken: auth.get() });
    return { session };
  })
  .guard(
    {
      beforeHandle: async ({ session, set }) => {
        if (session.kind === "not-logged-in") {
          return (set.status = "Unauthorized");
        }
      },
    },
    (app) =>
      app
        .derive(({ session }) => ({ user: session.user! }))
        .post("/log-out", (ctx) => {
          ctx.cookie.auth.set(getDeleteAuthCookie());
        })
  );

const app = new Elysia()
  .use(
    cors({
      credentials: true,
      allowedHeaders: ["Origin, X-Requested-With, Content-Type, Accept"],
    })
  )
  .use(authProtectedRoute)
  .use(userRoute)
  .onError(({ error }) => {
    return error.toString();
  })
  .listen(8080);

//
export type App = typeof app;
