import "./index.css";
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { edenTreaty } from "@elysiajs/eden";
import { z } from "zod";
import type { App } from "@fireside/backend";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import darkAsset from "./assets/dark.png";
import lightAsset from "./assets/light.png";
import logo from "./assets/bonfire.png";

import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
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
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "./hooks/useTheme";
import Landing from "./components/Landing";
import SignUp from "./components/Login";

import { Button } from "./components/ui/button";
import Register from "./components/Register";
import { Toaster } from "./components/ui/toaster";
import { FiresideUser, userQueryOptions, useUser } from "./lib/useUser";
import { CircleUser } from "lucide-react";
import { run } from "@fireside/utils";
import { LoadingSpinner } from "./components/ui/loading";
import { Profile } from "./components/Profile";
import { cn } from "./lib/utils";
import { ExploreSidebar } from "./components/ExploreSideBar";
import { ExploreContent } from "./components/ExploreContent";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "./components/ui/dropdown-menu";
import { useToast } from "./components/ui/use-toast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});
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

const ReactiveAuthRedirect = ({ children }: { children: React.ReactNode }) => {
  const userQuery = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userQuery.data) {
      navigate({ to: "/login" });
    }
  }, [userQuery.data]);

  return <>{children}</>;
};

export const client = edenTreaty<App>(import.meta.env.VITE_API_URL);

function RootComponent() {
  const { theme, setTheme } = useTheme();
  const user = useUser();
  const navigate = useNavigate({
    from: "/",
  });
  const router = useRouterState();

  const toggleTheme = () => {
    setTheme(theme.value === "light" ? "dark" : "light");
  };

  const handleLoginClick = () => {
    navigate({ to: "/login" });
  };

  const { toast } = useToast();

  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await client.protected.user["log-out"].post({
        $fetch: {
          credentials: "include",
        },
      });
      if (res.error) {
        throw new Error(res.error.value);
      }

      return res.data;
    },
    onSuccess: () => {
      queryClient.setQueryData<FiresideUser>(userQueryOptions.queryKey, null);
      toast({
        title: "Logged out!",
      });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Could not log out",
        description: err.message,
      });
    },
  });
  return (
    <div className="min-h-calc flex flex-col items-start w-screen justify-start">
      <div className="flex justify-between items-center mx-auto w-full px-10 h-16">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Logo" className="h-8 w-8 mr-2" />
          <span className={`text-xl`}>Fireside</span>
        </Link>
        <div className="flex items-center">
          <Button
            variant={"ghost"}
            onClick={toggleTheme}
            className={cn(["mr-3"])}
          >
            <img
              src={theme.value === "light" ? lightAsset : darkAsset}
              alt="Theme toggle"
              className="h-6 w-6"
            />
          </Button>
          <div className="mx-3 h-6 w-px bg-foreground"></div>
          {!user.data && (
            <Button
              variant={"ghost"}
              disabled={router.location.pathname === "/login"}
              onClick={handleLoginClick}
              className={"text-sm mr-3 "}
            >
              Log in
            </Button>
          )}
          {run(() => {
            switch (user.status) {
              case "error": {
                return null;
              }
              case "pending": {
                return <LoadingSpinner />;
              }

              case "success": {
                if (user.data) {
                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant={"ghost"}>
                          <CircleUser />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => navigate({ to: "/profile" })}
                        >
                          Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => logoutMutation.mutate()}
                        >
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }
                return (
                  <Button
                    disabled={router.location.pathname === "/register"}
                    variant={"ghost"}
                    onClick={() => {
                      navigate({ to: "/register" });
                    }}
                    className={`px-4 py-2 rounded`}
                  >
                    Get Started
                  </Button>
                );
              }
            }
          })}
        </div>
      </div>
      <Toaster />
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

const landingPageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Landing,
});

const registerPageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: Register,
  beforeLoad: ({ context: { queryClient } }) => {
    const user = queryClient.getQueryData<FiresideUser>(
      userQueryOptions.queryKey
    );
    if (user) {
      throw redirect({ from: "/register", to: "/" });
    }
  },
});

const loginPageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: SignUp,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(userQueryOptions);
  },
  beforeLoad: ({ context: { queryClient } }) => {
    const user = queryClient.getQueryData<FiresideUser>(
      userQueryOptions.queryKey
    );
    if (user) {
      throw redirect({ from: "/register", to: "/" });
    }
  },
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: () => (
    <ReactiveAuthRedirect>
      <Profile />
    </ReactiveAuthRedirect>
  ),
  beforeLoad: async ({ context: { queryClient } }) => {
    await persister.restoreClient();
    const user = queryClient.getQueryData<FiresideUser>(
      userQueryOptions.queryKey
    );
    if (!user) {
      throw redirect({ from: "/profile", to: "/login" });
    }
    return { user };
  },
});

const exploreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/explore/",
  pendingComponent: LoadingSpinner,
  component: ExploreContent,
  beforeLoad: async ({ context: { queryClient } }) => {
    await persister.restoreClient();
    if (!queryClient.getQueryData<FiresideUser>(userQueryOptions.queryKey)) {
      throw redirect({ from: "/explore", to: "/register" });
    }
  },
});

const routeTree = rootRoute.addChildren([
  landingPageRoute,
  registerPageRoute,
  loginPageRoute,
  profileRoute,
  exploreRoute,
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
  </React.StrictMode>
);
