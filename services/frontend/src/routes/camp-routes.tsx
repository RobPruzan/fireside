import { Camp } from "@/components/camps/Camp";
import { Explore } from "@/components/camps/Explore";
import { Friends } from "@/components/camps/Friends";
import { RootCampLayout } from "@/components/camps/RootCampLayout";
import {
  getUserCampQueryOptions,
  getAllCampsQueryOptions,
} from "@/components/camps/camps-state";
import {
  getFriendRequestsQueryOptions,
  usersQueryOptions,
} from "@/components/camps/friends-state";
import { LoadingScreen, LoadingSection } from "@/components/ui/loading";

import { createRoute } from "@tanstack/react-router";

import { authRootLayout } from "./layouts";
import { Inbox } from "@/components/camps/Inbox";

export const campLayoutRoute = createRoute({
  getParentRoute: () => authRootLayout,
  id: "camp-layout",
  loader: async ({ context: { queryClient, user } }) =>
    Promise.all([
      queryClient.ensureQueryData(getUserCampQueryOptions({ userId: user.id })),
      queryClient.ensureQueryData(getAllCampsQueryOptions({ userId: user.id })),
    ]),
  pendingComponent: LoadingScreen,
  component: RootCampLayout,
});

export const exploreRoute = createRoute({
  getParentRoute: () => campLayoutRoute,
  path: "/camp",
  component: Explore,
});

export const friendsRoute = createRoute({
  getParentRoute: () => campLayoutRoute,
  path: "/camp/friends",
  pendingComponent: LoadingSection,
  loader: async ({ context: { queryClient, user } }) =>
    Promise.all([
      queryClient.ensureQueryData(
        getFriendRequestsQueryOptions({ userId: user.id }),
      ),
      queryClient.ensureQueryData(usersQueryOptions),
    ]),
  component: Friends,
});

export const inboxRoute = createRoute({
  getParentRoute: () => campLayoutRoute,
  path: "/camp/inbox",
  pendingComponent: LoadingSection,
  loader: async ({ context: { queryClient, user } }) =>
    queryClient.ensureQueryData(
      getFriendRequestsQueryOptions({ userId: user.id }),
    ),
  component: Inbox,
});
export const campRoute = createRoute({
  getParentRoute: () => campLayoutRoute,
  path: "/camp/$campId",
  component: Camp,
  pendingComponent: LoadingSection,
});
