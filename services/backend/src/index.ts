import cors from "@elysiajs/cors";
import { db } from "@malevolent/db";
import { user } from "@malevolent/db/src/schema";
import { Elysia } from "elysia";
import { userRoute } from "./user/user";

const app = new Elysia()
  .use(cors())
  .use(userRoute)
  .get("/hi", () => {
    console.log("hello");
    return "sup";
  })
  .get("/test", async () => {
    console.log("req");
    const users = await db.select().from(user);
    console.log({ users });
    return { msg: "hello", users };
  })

  .listen(8080);

export type App = typeof app;
