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

const rateLimitMap = new Map<string, Array<number>>();
const blockedIpsMap = new Map<string, number>();

const app = new Elysia()
  .derive(({ request, set }) => {
    const ip = request.headers.get("X-Forwarded-For");
    if (!ip && process.env.NODE_ENV !== "production") {
      return {};
    }

    if (!ip) {
      set.status = 500;
      throw new Error("Couldn't find client ip address");
    }

    const blockedIpTiming = blockedIpsMap.get(ip);

    if (blockedIpTiming && Date.now() - blockedIpTiming < 1000 * 30) {
      set.status = 429;
      console.log("BLOCKED CAUSE HERE");
      throw new Error("Too Many Requests");
    }

    const currentVisits = rateLimitMap.get(ip) ?? [];

    const visits = [...currentVisits, Date.now()];
    rateLimitMap.set(ip, visits);

    const filteredVisits = visits.filter(
      (prevDate) => Date.now() - prevDate < 1000 * 10
    );

    rateLimitMap.set(ip, filteredVisits);

    if (filteredVisits.length > 50) {
      blockedIpsMap.set(ip, Date.now());
      set.status = 429;
      throw new Error("Too Many Requests");
    }

    return {};
  })
  .onBeforeHandle(({ set, request }) => {
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
    console.log("dont care requesting");
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

    set.headers["Cache-Control"] =
      "public, max-age=31536000, s-maxage=31536000, immutable";

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
      set.headers["Content-Type"] = assetFile.type;

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
