import {
  QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import darkAsset from "./assets/dark.png";
import lightAsset from "./assets/light.png";
import {
  Link,
  Outlet,
  createRootRouteWithContext,
  createRoute,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import logo from "./assets/bonfire.png";
import { ExploreCamp } from "./components/ExploreContent";
import Landing from "./components/Landing";
import SignUp from "./components/Login";
import { Profile } from "./components/Profile";
import { LoadingSpinner } from "./components/ui/loading";
import { FiresideUser, useUser, userQueryOptions } from "./lib/useUser";
import { run } from "@fireside/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { CircleUser } from "lucide-react";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/toaster";
import { useToast } from "./components/ui/use-toast";
import { useTheme } from "./hooks/useTheme";
import { cn } from "./lib/utils";
import { client } from "./main";
import Register from "./components/Register";
import { useEffect } from "react";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

export const persister = createSyncStoragePersister({
  storage: window.localStorage,
});
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
export const rootRoute = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: () => {
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
  },
});

export const landingPageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Landing,
});

export const registerPageRoute = createRoute({
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

export const loginPageRoute = createRoute({
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

export const profileRoute = createRoute({
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

export const exploreRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/explore/$id",
  pendingComponent: LoadingSpinner,
  component: ExploreCamp,
  loader: async () => await queryClient.ensureQueryData(userQueryOptions),
  beforeLoad: async ({ context: { queryClient } }) => {
    await persister.restoreClient();
    const user = queryClient.getQueryData<FiresideUser>(
      userQueryOptions.queryKey
    );
    if (!queryClient.getQueryData<FiresideUser>(userQueryOptions.queryKey)) {
      throw redirect({ from: "/explore/$id", to: "/register" });
    }
    return { user };
  },
});

export const routeTree = rootRoute.addChildren([
  landingPageRoute,
  registerPageRoute,
  loginPageRoute,
  profileRoute,
  exploreRoute,
]);
