import { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  createRoute,
  useNavigate,
  Outlet,
  redirect,
  MatchRoute,
  createRouter,
} from "@tanstack/react-router";
import { FiresideUser, useUser, userQueryOptions } from "./lib/useUser";

import { useEffect } from "react";

import Register from "./components/landing/Register";
import SignUp from "./components/landing/Login";
import { Profile } from "./components/landing/Profile";
import { Explore } from "./components/camp/Explore";
import { RootCampLayout } from "./components/camp/RootCampLayout";
import { NavBar } from "./components/camp/NavBar";
import Landing from "./components/landing/Landing";
import { LoadingSpinner } from "./components/ui/loading";
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
//
const getUser = async ({ queryClient }: { queryClient: QueryClient }) => {
  await persister.restoreClient();
  return queryClient.getQueryData<FiresideUser>(userQueryOptions.queryKey);
};
const ReactiveAuthRedirect = ({ children }: { children: React.ReactNode }) => {
  const userQuery = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userQuery.data) {
      navigate({ to: "/" });
    }
  }, [userQuery.data]);

  return <>{children}</>;
};
export const rootRoute = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()();

export const rootLandingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <div>
      <NavBar />
      <MatchRoute to="/">
        <Landing />
      </MatchRoute>
      <Outlet />
    </div>
  ),
});

export const registerPageRoute = createRoute({
  getParentRoute: () => rootLandingRoute,
  path: "/register",
  component: Register,
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
  loader: async ({ context: { queryClient } }) => {
    const user = await getUser({ queryClient });
    if (user) {
      throw redirect({ from: "/register", to: "/" });
    }
  },
});

export const campRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/camp",
  loader: async ({ context: { queryClient } }) => {
    const user = await getUser({ queryClient });
    if (!user) {
      throw redirect({ from: "/register", to: "/" });
    }
  },
  pendingComponent: LoadingSpinner,
  component: () => (
    <ReactiveAuthRedirect>
      <RootCampLayout />
    </ReactiveAuthRedirect>
  ),
});

export const exploreRoute = createRoute({
  getParentRoute: () => campRoute,
  path: "/",
  loader: async ({ context: { queryClient } }) => {
    const user = await getUser({ queryClient });
    if (!user) {
      throw redirect({ from: "/profile", to: "/login" });
    }
    return { user };
  },
  component: Explore,
});

export const routeTree = rootRoute.addChildren([
  rootLandingRoute.addChildren([
    registerPageRoute,
    loginPageRoute,
    profileRoute,
  ]),
  campRoute.addChildren([exploreRoute]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  context: {
    queryClient,
  },
});
