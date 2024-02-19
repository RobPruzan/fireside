import React, { useState } from "react";
import ReactDOM from "react-dom/client";
// import { logMe } from "@malevolent/backend";
import { edenTreaty } from "@elysiajs/eden";
import "./index.css";
import { z } from "zod";
import type { App } from "@malevolent/backend";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { test } from "@malevolent/utils";
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Link,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button } from "./components/ui/button";
import { ThemeProvider, useTheme } from "./hooks/useTheme";
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
type GetType = ReturnType<typeof client.test.get> extends Promise<infer R>
  ? R
  : never;
function RootComponent() {
  const [result, setResult] = useState<string | null>(null);
  const [users, setUsers] = useState<NonNullable<GetType["data"]>["users"]>([]);
  const { theme, setTheme } = useTheme();
  return (
    <div className="min-h-screen  flex flex-col items-start w-screen">
      <div className="w-full flex">
        <Link to="/">Home</Link>
        <Link to="/random">random</Link>
        <Button
          onClick={() => {
            setTheme((prev) => (prev === "dark" ? "light" : "dark"));
          }}
        >
          {theme.value === "dark" ? "light" : "dark"}
        </Button>
      </div>
      <Button
        onClick={async () => {
          const res = (await client.test.get()).data;
          setResult(res?.msg ?? null);
          setUsers(res?.users ?? []);
        }}
      >
        Get data
      </Button>
      <Button onClick={() => setResult(null)}>Clear data</Button>
      <Button
        onClick={async () => {
          await client.create.post();
          const res = (await client.test.get()).data;
          setUsers(res?.users ?? []);
        }}
      >
        Make fake user
      </Button>
      Data: {result}
      ----- Users:{" "}
      {users.map((user) => (
        <div>{JSON.stringify(user)}</div>
      ))}
      <Outlet />
      <ReactQueryDevtools buttonPosition="bottom-left" />
    </div>
  );
}

const rootRoute = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <div>justa index route</div>,
});

const randomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/random",
  component: () => <div>hello random stuff</div>,
});

const queryClient = new QueryClient();

const routeTree = rootRoute.addChildren([indexRoute, randomRoute]);

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  // Since we're using React Query, we don't want loader calls to ever be stale
  // This will ensure that the loader is always called when the route is preloaded or visited
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
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);
