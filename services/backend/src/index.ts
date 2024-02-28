import cors from "@elysiajs/cors";
import { db } from "@fireside/db";
import { user } from "@fireside/db/src/schema";
import { Elysia } from "elysia";
import {
  getDeleteAuthCookie,
  userRoute,
  getSession,
} from "./user/authenticated";

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
        return session.user;
      },
    },
    (app) =>
      app
        .derive(({ session }) => ({ user: session.user! }))
        .post("/test", ({ user }) => {})
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
