import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
// import { logMe } from "@fireside/backend";
import { edenTreaty } from "@elysiajs/eden";
import "./index.css";
import { z } from "zod";
import type { App } from "@fireside/backend";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { run, test } from "@fireside/utils";
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Link,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Button } from "./components/ui/button";
import { ThemeProvider, useTheme } from "./hooks/useTheme";
import { User } from "../../db/src/schema";
import { useToast } from "./components/ui/use-toast";
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
const userQueryOptions = {
  queryKey: ["users"],
  queryFn: async () => {
    // artificial timeout
    await new Promise((res) => {
      setTimeout(() => {
        res(null);
      }, 1000);
    });

    return (await client.test.get()).data?.users ?? [];
  },
};
function RootComponent() {
  const { theme, setTheme } = useTheme();
  const userQuery = useSuspenseQuery(userQueryOptions);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createUserMutation = useMutation({
    mutationFn: (userInfo: { displayName: string }) =>
      client.user.create.post(userInfo),
    onSuccess: (res) => {
      if (res.error) {
        toast({
          variant: "destructive",
          title: "Failed to create user",
          description: res.error.message,
        });
        return;
      }
      queryClient.setQueriesData<Array<User>>(userQueryOptions, (prev) =>
        prev ? [...prev, res.data] : [res.data]
      );
    },
  });

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
        onClick={() => {
          createUserMutation.mutate({ displayName: "jimmy john" });
        }}
      >
        Make fake user
      </Button>

      {userQuery.data.map((user) => (
        <div>{JSON.stringify(user)}</div>
      ))}
      {createUserMutation.isPending && "Creating..."}
      <Outlet />
      <ReactQueryDevtools buttonPosition="bottom-left" />
    </div>
  );
}

const rootRoute = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootComponent,
  loader: () => queryClient.ensureQueryData(userQueryOptions),
  pendingComponent: () => <div>Im loading, pretty sick</div>,
  errorComponent: () => <div>error nooo</div>,
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
