import cors from "@elysiajs/cors";

import { Elysia, t } from "elysia";
import { userProtectedRoute, userRoute } from "./user-endpoints";
import { campRouter } from "./camp-endpoints";

import serverTiming from "@elysiajs/server-timing";
import { friendRoute } from "./friend-endpoints";
import staticPlugin from "@elysiajs/static";
import { messageRouter } from "./message-endpoints";
import { threadRouter } from "./thread-endpoints";
import { whiteboardRoute } from "./whiteboard-endpoints";
import { logger } from "@bogeychan/elysia-logger";

const port = 8080;

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
  // .use(
  //   logger({
  //     level: "trace",
  //   })
  // )
  .use(
    cors({
      credentials: true,
      origin:
        /(^http:\/\/localhost:5173$)|(https:\/\/fireside\.ninja)|(https:\/\/www\.fireside\.ninja)/,
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
    const uploadPath = path
      .split("/")
      .at(-1)
      ?.replaceAll("/", "")
      .replaceAll("..", "");
    const uploadFIle = uploadPath ? Bun.file(`./upload/${uploadPath}`) : null;

    // const splitPath =  path.split("/")

    set.headers["Cache-Control"] =
      "public, max-age=31536000, s-maxage=31536000, immutable";

    // if ("/api" in path) {
    //   return;
    // }

    console.log(
      "attempting to read",
      path,
      "vs real read path",
      `./upload/${uploadPath}`
    );

    if (uploadFIle && (await uploadFIle.exists())) {
      set.headers["Content-Type"] = uploadFIle.type;

      return uploadFIle;
    }

    if (await assetFile.exists()) {
      // console.log('at')
      set.headers["Content-Type"] = assetFile.type;

      // console.log("served", path);

      return assetFile;
    }

    if (await publicFile.exists()) {
      set.headers["Content-Type"] = publicFile.type;
      console.log("served", path);
      return publicFile;
    }
    set.headers["Content-Type"] = fallBackFile.type;
    // console.log("served", path);
    return fallBackFile;
  })

  .onError(({ error }) => {
    // console.log(error);
    return error.toString();
  })

  .listen({
    port,
    hostname: "0.0.0.0",
  });

console.log(`Running on port ${port}`);
export type App = typeof app;
//
