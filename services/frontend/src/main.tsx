import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { z } from "zod";

import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { ThemeProvider } from "./hooks/useTheme";

import {
  campLayoutRoute,
  exploreRoute,
  campRoute,
  friendsRoute,
  inboxRoute,
} from "./routes/camp-routes";
import {
  rootRoute,
  rootLandingLayout,
  rootLandingRoute,
  registerPageRoute,
  loginPageRoute,
  profileRoute,
} from "./routes/root-routes";
import { persister, queryClient } from "./query";
import { authRootLayout } from "./routes/layouts";

const envSchema = z.object(
  {
    VITE_API_URL: z.string(),
  },
  {
    errorMap: (error) => ({
      message: `Missing environment variable ${error.path.join(".")}`,
    }),
  },
);

envSchema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
});

declare global {
  interface ImportMetaEnv extends z.infer<typeof envSchema> {}
}

const routeTree = rootRoute.addChildren([
  rootLandingLayout.addChildren([
    rootLandingRoute,
    registerPageRoute,
    loginPageRoute,
    profileRoute,
  ]),
  authRootLayout.addChildren([
    campLayoutRoute.addChildren([
      exploreRoute,
      campRoute,
      friendsRoute,
      inboxRoute,
    ]),
  ]),
]);

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  context: {
    queryClient,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: persister,
        }}
      >
        <RouterProvider router={router} />
      </PersistQueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
