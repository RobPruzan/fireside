import {
  QueryClient,
  queryOptions,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  createRoute,
  useNavigate,
  Outlet,
  redirect,
  MatchRoute,
  createRouter,
  useMatchRoute,
  useRouterState,
} from "@tanstack/react-router";
import {
  FiresideUser,
  useUserQuery,
  userQueryOptions,
} from "./lib/useUserQuery";

import { useEffect } from "react";

import Register from "./components/landing/Register";
import SignUp from "./components/landing/Login";
import { Profile } from "./components/landing/Profile";
import { Explore } from "./components/camps/Explore";
import { RootCampLayout } from "./components/camps/RootCampLayout";
import { NavBar } from "./components/camps/NavBar";
import Landing from "./components/landing/Landing";
import { LoadingSpinner } from "./components/ui/loading";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { getCampQueryOptions } from "./lib/useCampsQuery";
import { Camp } from "./components/camps/Camp";
import { Friends } from "./components/camps/Friends";

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
//
const getUser = async ({ queryClient }: { queryClient: QueryClient }) => {
  await persister.restoreClient();
  return queryClient.getQueryData<FiresideUser>(userQueryOptions.queryKey);
};
const ReactiveAuthRedirect = ({ children }: { children: React.ReactNode }) => {
  const user = useQueryClient().getQueryData<FiresideUser>(
    userQueryOptions.queryKey
  );

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate({ to: "/" });
    }
  }, [user]);

  return <>{children}</>;
};
export const rootRoute = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()();

export const rootLandingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => {
    const { isTransitioning } = useRouterState();
    return (
      <>
        <NavBar />
        <MatchRoute to="/">{!isTransitioning && <Landing />}</MatchRoute>
        <Outlet />
      </>
    );
  },
});

export const registerPageRoute = createRoute({
  getParentRoute: () => rootLandingRoute,
  path: "/register",
  component: Register,
  pendingComponent: LoadingSpinner,
  loader: async ({ context: { queryClient } }) => {
    const user = await getUser({ queryClient });
    if (user) {
      throw redirect({ from: "/register", to: "/" });
    }
  },
});

export const profileRoute = createRoute({
  getParentRoute: () => rootLandingRoute,
  path: "/profile",
  component: () => (
    <ReactiveAuthRedirect>
      <Profile />
    </ReactiveAuthRedirect>
  ),
  pendingComponent: LoadingSpinner,
  loader: async ({ context: { queryClient } }) => {
    const user = await getUser({ queryClient });
    if (!user) {
      throw redirect({ from: "/profile", to: "/login" });
    }
    return { user };
  },
});

export const loginPageRoute = createRoute({
  getParentRoute: () => rootLandingRoute,
  path: "/login",
  component: SignUp,
  pendingComponent: LoadingSpinner,
  loader: async ({ context: { queryClient } }) => {
    const user = await getUser({ queryClient });
    if (user) {
      throw redirect({ from: "/login", to: "/" });
    }
  },
});

export const campsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/camp",
  loader: async ({ context: { queryClient } }) => {
    const user = await getUser({ queryClient });

    if (!user) {
      throw redirect({ from: "/register", to: "/" });
    }
    await queryClient.ensureQueryData(
      getCampQueryOptions({ userId: user?.id })
    );

    return { user };
  },
  pendingComponent: LoadingSpinner,
  component: () => (
    <ReactiveAuthRedirect>
      <RootCampLayout />
    </ReactiveAuthRedirect>
  ),
});

export const exploreRoute = createRoute({
  getParentRoute: () => campsRoute,
  path: "/",
  loader: async ({ context: { queryClient } }) => {
    const user = await getUser({ queryClient });
    if (!user) {
      throw redirect({ from: "/camp", to: "/login" });
    }
    await queryClient.ensureQueryData(getCampQueryOptions({ userId: user.id }));

    return { user };
  },
  component: Explore,
});

export const friendsRoute = createRoute({
  getParentRoute: () => campsRoute,
  path: "/friends",
  loader: async ({ context: { queryClient } }) => {
    const user = await getUser({ queryClient });
    if (!user) {
      throw redirect({ from: "/camp", to: "/login" });
    }
    return { user };
  },
  component: Friends,
});
export const campRoute = createRoute({
  getParentRoute: () => campsRoute,
  path: "/$campId",
  loader: async ({ context: { queryClient } }) => {
    const user = await getUser({ queryClient });
    if (!user) {
      throw redirect({ from: "/camp/$campId", to: "/login" });
    }
    return { user };
  },
  component: Camp,
});

export const routeTree = rootRoute.addChildren([
  rootLandingRoute.addChildren([
    registerPageRoute,
    loginPageRoute,
    profileRoute,
  ]),
  campsRoute.addChildren([exploreRoute, campRoute, friendsRoute]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  context: {
    queryClient,
  },
});
