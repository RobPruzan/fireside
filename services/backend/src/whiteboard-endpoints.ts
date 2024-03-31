import { ProtectedElysia } from "./lib";

export const whiteboardRoute = ProtectedElysia({ prefix: "/whiteboard" }).ws(
  "/ws",
  {
    message: (ws) => {},
  }
);
