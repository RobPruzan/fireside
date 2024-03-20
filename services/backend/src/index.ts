import cors from "@elysiajs/cors";

import { Elysia } from "elysia";
import { userProtectedRoute, userRoute } from "./user-endpoints";
import { campRouter } from "./camp-endpoints";
import { createDB } from "@fireside/db";
import serverTiming from "@elysiajs/server-timing";
import { friendRoute } from "./friend-endpoints";
import staticPlugin from "@elysiajs/static";

const port = 8080;

export const { db } = createDB();

const authRoutes = new Elysia().use(campRouter).use(userProtectedRoute);
const noAuthRoutes = new Elysia().use(userRoute);

const app = new Elysia()
  .use(
    cors({
      credentials: true,
      origin: /^http:\/\/localhost:5173$/,
      allowedHeaders: ["Origin, X-Requested-With, Content-Type, Accept"],
    })
  )
  .use(serverTiming())
  // .use(staticPlugin())
  // .use(
  //   staticPlugin({
  //     prefix: "static",
  //   })
  // )
  .group("/api", (app) =>
    app

      // order matters till v1.0 local scoping can be implemented
      .use(noAuthRoutes)
      .use(authRoutes)
      .use(friendRoute)
  )
  // .get("/", () => Bun.file("static/index.html"))
  .use(staticPlugin({ prefix: "/", assets: "./public" }))
  .get("/*", async ({ path }) => {
    const assetFile = Bun.file(
      `./static/assets/${path.replaceAll("/", "").replace("assets", "")}`
    );
    const publicFile = Bun.file(`./public/${path.replaceAll("/", "")}`);
    const fallBackFile = Bun.file("./static/index.html");
    console.log(
      path,
      await assetFile.exists(),
      await publicFile.exists(),
      await fallBackFile.exists()
    );
    if (await assetFile.exists()) {
      return assetFile;
    }

    if (await publicFile.exists()) {
      return publicFile;
    }

    return fallBackFile;
  })

  .onError(({ error }) => {
    return error.toString();
  })

  .listen(port);

console.log(`Running on port ${port}`);
export type App = typeof app;
//
