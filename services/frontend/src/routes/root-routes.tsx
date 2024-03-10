import Landing from "@/components/landing/Landing";
import SignUp from "@/components/landing/Login";
import { Profile } from "@/components/landing/Profile";
import { LoadingSection } from "@/components/ui/loading";

import {
  Outlet,
  createRootRouteWithContext,
  createRoute,
} from "@tanstack/react-router";

import Register from "@/components/landing/Register";
import { NavBar } from "@/components/camps/NavBar";
import { QueryClient } from "@tanstack/react-query";

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
  component: SignUp,
  pendingComponent: LoadingSection,
});
