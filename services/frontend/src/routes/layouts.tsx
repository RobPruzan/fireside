import { createRoute, redirect, Outlet } from "@tanstack/react-router";
import { getUser, ReactiveAuthRedirect } from "./route-helpers";
import { rootRoute } from "./root-routes";
import { LoadingScreen } from "@/components/ui/loading";
import { Toaster } from "@/components/ui/toaster";

export const authLandingLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: "landing-auth",
  beforeLoad: async ({ context: { queryClient } }) => {
    const user = await getUser({ queryClient });
    if (!user) {
      throw redirect({ to: "/" });
    }
    return { user };
  },
  component: () => (
    <ReactiveAuthRedirect>
      <Outlet />
      <Toaster />
    </ReactiveAuthRedirect>
  ),
  pendingComponent: LoadingScreen,
});

export const authRootLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: "root-auth",
  beforeLoad: async ({ context: { queryClient } }) => {
    const user = await getUser({ queryClient });
    if (!user) {
      throw redirect({ to: "/" });
    }
    return { user };
  },
  component: () => (
    <ReactiveAuthRedirect>
      <Outlet />
      <Toaster />
    </ReactiveAuthRedirect>
  ),
  pendingComponent: LoadingScreen,
});
