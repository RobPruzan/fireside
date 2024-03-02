import { edenTreaty } from "@elysiajs/eden";
import { App } from "@fireside/backend";

export const client = edenTreaty<App>(import.meta.env.VITE_API_URL, {
  $fetch: {
    credentials: "include",
  },
});
