import cors from "@elysiajs/cors";

import { Elysia } from "elysia";
import { userProtectedRoute, userRoute } from "./user";
import { campRouter } from "./camp";

const port = 8080;

const app = new Elysia()
  .use(
    cors({
      credentials: true,
      allowedHeaders: ["Origin, X-Requested-With, Content-Type, Accept"],
    })
  )
  .use(userProtectedRoute)
  .use(userRoute)
  .use(campRouter)
  .onError(({ error }) => {
    return error.toString();
  })
  .listen(port);

console.log(`Running on port ${port}`);

export type App = typeof app;
