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
  .get("/hi", () => {
    console.log("hello");
    return "sup";
  })
  .get("/test", async () => {
    console.log("reb");
    const users = await db.select().from(user);
    console.log({ users });
    console.log({ users });
    return { msg: "hello", users };
  })

  .listen(8080);

export type App = typeof app;
