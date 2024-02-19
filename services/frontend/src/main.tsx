import React from "react";
import ReactDOM from "react-dom/client";
// import { logMe } from "@malevolent/backend";
import { edenTreaty } from "@elysiajs/eden";
import "./index.css";
import { z } from "zod";
import type { App } from "@malevolent/backend";

const envSchema = z.object(
  {
    VITE_API_URL: z.string(),
  },
  {
    errorMap: (error) => ({
      message: `Missing environment variable ${error.path.join(".")}`,
    }),
  }
);

envSchema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
});

declare global {
  interface ImportMetaEnv extends z.infer<typeof envSchema> {}
}

const client = edenTreaty<App>(import.meta.env.VITE_API_URL);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <div
      onClick={() => {
        client.test.get().then(console.log);
      }}
    >
      hellofdsaf
    </div>
  </React.StrictMode>
);
