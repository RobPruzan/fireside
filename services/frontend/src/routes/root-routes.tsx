import Landing from "@/components/landing/Landing";
import Login from "@/components/landing/Login";
import { Profile } from "@/components/landing/Profile";
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
  campRouteTree,
} from "./camp-routes";
import { authRootLayout } from "./layouts";
import { CircleUserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export const profileRoute = createRoute({
  getParentRoute: () => rootLandingLayout,
  path: "/profile",
  component: Profile,
  pendingComponent: LoadingSection,
});

export const loginPageRoute = createRoute({
  getParentRoute: () => rootLandingLayout,
  path: "/login",
  component: Login,
  pendingComponent: LoadingSection,
});

export const addProfilePictureRoute = createRoute({
  getParentRoute: () => rootLandingLayout,
  path: "/pfp",
  component: () => {
    return (
      <div className="w-full h-full flex flex-col flex-start items-center p-30 gap-y-10">
        <span className="text-2xl font-bold">Choose your profile picture</span>

        <div className="flex flex-wrap w-1/2 md:w-1/4 gap-2 justify-center">
          {Array.from({ length: 9 }).map(() => (
            <Button className="h-fit w-fit" variant={"ghost"}>
              <CircleUserRound size={80} />
            </Button>
          ))}
        </div>
      </div>
    );
  },
  pendingComponent: LoadingSection,
});

export const routeTree = rootRoute.addChildren([
  rootLandingLayout.addChildren([
    rootLandingRoute,
    registerPageRoute,
    loginPageRoute,
    profileRoute,
    addProfilePictureRoute,
  ]),
  authRootLayout.addChildren([campRouteTree]),
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
