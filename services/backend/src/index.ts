import cors from "@elysiajs/cors";

import { Elysia } from "elysia";
import { userProtectedRoute, userRoute } from "./user-endpoints";
import { campRouter } from "./camp-endpoints";
import { createDB } from "@fireside/db";
import serverTiming from "@elysiajs/server-timing";
import { friendRoute } from "./friend-endpoints";
import staticPlugin from "@elysiajs/static";
import { messageRouter } from "./message-endpoints";

const port = 8080;

export const { db } = createDB();

const authRoutes = new Elysia()
  .use(campRouter)
  .use(userProtectedRoute)
  .use(friendRoute)
  .use(messageRouter);
const noAuthRoutes = new Elysia().use(userRoute);

const app = new Elysia()
  .onBeforeHandle(({ set }) => {
    set.headers["X-Content-Type-Options"] = "nosniff";
  })
  .use(
    cors({
      credentials: true,
      origin: /^http:\/\/localhost:5173$/,
      allowedHeaders: ["Origin, X-Requested-With, Content-Type, Accept"],
    })
  )
  .use(serverTiming())
  .group("/api", (app) =>
    app
      // order matters till v1.0 local scoping can be implemented
      .use(noAuthRoutes)
      .use(authRoutes)
  )
  .get("/*", async ({ path }) => {
    const assetFile = Bun.file(
      `./node_modules/@fireside/frontend/dist/assets/${path
        .replaceAll("/", "")
        .replace("assets", "")}`
    );
    const publicFile = Bun.file(
      `./node_modules/@fireside/frontend/dist/${path.replaceAll("/", "")}`
    );
    const fallBackFile = Bun.file(
      "./node_modules/@fireside/frontend/dist/index.html"
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
