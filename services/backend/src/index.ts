import cors from "@elysiajs/cors";
import { db } from "@fireside/db";
import { user } from "@fireside/db/src/schema";
import { Elysia } from "elysia";
import { userRoute } from "./user/user";

const app = new Elysia()
  .use(
    cors({
      credentials: true,
      allowedHeaders: ["Origin, X-Requested-With, Content-Type, Accept"],
    })
  )
  .use(userRoute)
  .onError(({ error }) => {
    return error.toString();
  })
  .listen(8080);

export type App = typeof app;
