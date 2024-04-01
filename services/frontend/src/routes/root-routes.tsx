import Landing from "@/components/landing/Landing";
import Login from "@/components/landing/Login";
import { Profile } from "@/components/camps/Profile";
import { LoadingSection } from "@/components/ui/loading";

import {
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

import Register from "@/components/landing/Register";
import { NavBar } from "@/components/camps/NavBar";
import { QueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "@/query";
import {
  campLayoutRoute,
  exploreRoute,
  campRoute,
  friendsRoute,
  inboxRoute,
  profileRoute
} from "./camp-routes";
import { authRootLayout } from "./layouts";

export const rootRoute = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()();

export const rootLandingLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: "root",
  component: () => {
    return (
      <>
        <NavBar />
        <Outlet />
        <Toaster />
      </>
    );
  },
});

export const rootLandingRoute = createRoute({
  getParentRoute: () => rootLandingLayout,
  path: "/",
  component: Landing,
});

export const registerPageRoute = createRoute({
  getParentRoute: () => rootLandingLayout,
  path: "/register",
  component: Register,
  pendingComponent: LoadingSection,
});

export const loginPageRoute = createRoute({
  getParentRoute: () => rootLandingLayout,
  path: "/login",
  component: Login,
  pendingComponent: LoadingSection,
});

export const routeTree = rootRoute.addChildren([
  rootLandingLayout.addChildren([
    rootLandingRoute,
    registerPageRoute,
    loginPageRoute,
  ]),
  authRootLayout.addChildren([
    campLayoutRoute.addChildren([
      exploreRoute,
      campRoute,
      friendsRoute,
      inboxRoute,
      profileRoute,
    ]),
  ]),
]);

export const router = createRouter({
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
