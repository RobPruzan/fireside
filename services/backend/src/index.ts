import cors from "@elysiajs/cors";

import { Elysia, t } from "elysia";
import { userProtectedRoute, userRoute } from "./user-endpoints";
import { campRouter } from "./camp-endpoints";
import { createDB } from "@fireside/db";
import serverTiming from "@elysiajs/server-timing";
import { friendRoute } from "./friend-endpoints";
import staticPlugin from "@elysiajs/static";
import { messageRouter } from "./message-endpoints";
import { threadRouter } from "./thread-endpoints";
import { whiteboardRoute } from "./whiteboard-endpoints";
import { logger } from "@bogeychan/elysia-logger";

const port = 8080;

export const { db } = createDB({
  connString: process.env.CONNECTION_STRING!,
});

const authRoutes = new Elysia()
  .use(campRouter)
  .use(userProtectedRoute)
  .use(friendRoute)
  .use(messageRouter)
  .use(threadRouter)
  .use(whiteboardRoute);
const noAuthRoutes = new Elysia().use(userRoute);

const app = new Elysia()
  .onBeforeHandle(({ set }) => {
    set.headers["X-Content-Type-Options"] = "nosniff";
  })
  .use(
    logger({
      level: "trace",
    })
  )
  .use(
    cors({
      credentials: true,
      origin: /(^http:\/\/localhost:5173$)|(https:\/\/fireside\.ninja)|(https:\/\/www\.fireside\.ninja)/,
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
  .get("/*", async ({ path, set }) => {
    const assetFile = Bun.file(
      `./node_modules/@fireside/frontend/dist/assets/${path
        .replaceAll("/", "")
        .replaceAll("..", "")
        .replace("assets", "")}`
    );
    const publicFile = Bun.file(
      `./node_modules/@fireside/frontend/dist/${path
        .replaceAll("/", "")
        .replaceAll("..", "")}`
    );
    const fallBackFile = Bun.file(
      "./node_modules/@fireside/frontend/dist/index.html"
    );

    if (await assetFile.exists()) {
      set.headers["Content-Type"] = assetFile.type;
      // if (assetFile.name?.includes(".css" ||  publicFile.type === "javascript")) {

      // }
      // if (assetFile.name?.includes(".js")) {
      //   set.headers["Content-Type"] = publicFile.type
      // }
      // if (assetFile.name?.includes(".html")) {
      //   set.headers["Content-Type"] = publicFile.type
      // }
      return assetFile;
    }

    if (await publicFile.exists()) {
      set.headers["Content-Type"] = publicFile.type;
      return publicFile;
    }
    set.headers["Content-Type"] = fallBackFile.type;
    return fallBackFile;
  })

  .onError(({ error }) => {
    return error.toString();
  })

  .listen({
    port,
    hostname: "0.0.0.0",
  });

console.log(`hiRunning on port ${port}`);
export type App = typeof app;
