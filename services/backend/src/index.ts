import cors from "@elysiajs/cors";

import { Elysia } from "elysia";
import { userProtectedRoute, userRoute } from "./user";

const app = new Elysia()
  .use(
    cors({
      credentials: true,
      allowedHeaders: ["Origin, X-Requested-With, Content-Type, Accept"],
    })
  )
  .use(userRoute)
  .use(userProtectedRoute)
  .onError(({ error }) => {
    return error.toString();
  })
  .listen(8080);

export type App = typeof app;
