import { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  createRoute,
  redirect,
  useMatch,
  useMatchRoute,
  useChildMatches,
  useNavigate,
  Outlet,
} from "@tanstack/react-router";
import Landing from "./components/landing/Landing";
import SignUp from "./components/landing/Login";
import { Profile } from "./components/landing/Profile";
import { FiresideUser, useUser, userQueryOptions } from "./lib/useUser";

import Register from "./components/landing/Register";
import { useEffect } from "react";
import { RootLandingLayout } from "./components/landing/RootLandingLayout";
import { RootCampLayout } from "./components/camp/RootCampLayout";
import { Explore } from "./components/camp/Explore";
import { persister } from "./main";

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
}>()({
  loader: async ({ context: { queryClient }, location, navigate }) => {
    const user = await getUser({ queryClient });
    if (user && location.href === "/") {
      navigate({ from: "/", to: "/camp" });
    }
  },
  pendingComponent: () => <>...</>,
  component: () => {
    const firstChild = useChildMatches().at(0);
    if (firstChild?.id === "/camp") {
      return <RootCampLayout />;
    }

    return <RootLandingLayout />;
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
  loader: async ({ context: { queryClient } }) => {
    const user = await getUser({ queryClient });
    if (user) {
      throw redirect({ from: "/register", to: "/" });
    }
  },
});

export const loginPageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: SignUp,
  loader: async ({ context: { queryClient } }) => {
    const user = await getUser({ queryClient });
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
  loader: async ({ context: { queryClient } }) => {
    const user = await getUser({ queryClient });
    if (!user) {
      throw redirect({ from: "/profile", to: "/login" });
    }
    return { user };
  },
});

export const campRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/camp",

  component: () => (
    <ReactiveAuthRedirect>
      <Outlet />
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
  landingPageRoute,
  registerPageRoute,
  loginPageRoute,
  profileRoute,
  campRoute.addChildren([exploreRoute]),
]);
