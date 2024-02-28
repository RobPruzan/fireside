import cors from "@elysiajs/cors";
import { db } from "@fireside/db";
import { user } from "@fireside/db/src/schema";
import { Elysia } from "elysia";
import {
  getDeleteAuthCookie,
  userRoute,
  validateAuthToken,
} from "./user/authenticated";

const authProtectedRoute = new Elysia({ prefix: "/protected" }).guard(
  {
    beforeHandle: async ({ cookie: { auth }, set }) => {
      if (
        (await validateAuthToken({ authToken: auth.get() })).kind ===
        "not-logged-in"
      ) {
        set.status = 401;
        return;
      }
    },
  },
  (app) =>
    app.post("/log-out", (ctx) => {
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
