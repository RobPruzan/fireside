import { Camp } from "@/components/camps/Camp";
import { Explore } from "@/components/camps/Explore";
import { Friends } from "@/components/camps/Friends";
import { Profile } from "@/components/camps/Profile";
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
import {
  getMessageReactionOptions,
  getMessagesOptions,
  reactionAssetsOptions,
} from "@/components/camps/message-state";
import { Thread } from "@/components/camps/Thread";
import { promise, z } from "zod";
import { getThreadsOptions } from "@/components/camps/thread-state";
// import { WhiteBoard } from "@/components/camps/whiteboard/WhiteBoard";

export const campLayoutRoute = createRoute({
  getParentRoute: () => authRootLayout,
  validateSearch: (search) =>
    z
      .object({
        threadId: z.string().optional(),
        whiteBoardId: z.string().optional(),
      })
      .parse(search),
  id: "camp-layout",
  loader: async ({ context: { queryClient, user } }) =>
    Promise.all([
      queryClient.ensureQueryData(getUserCampQueryOptions({ userId: user.id })),
      queryClient.ensureQueryData(getAllCampsQueryOptions({ userId: user.id })),
      queryClient.ensureQueryData(reactionAssetsOptions),
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
        getFriendRequestsQueryOptions({ userId: user.id })
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
      getFriendRequestsQueryOptions({ userId: user.id })
    ),
  component: Inbox,
});
export const campRoute = createRoute({
  getParentRoute: () => campLayoutRoute,
  path: "/camp/$campId",

  loader: ({ context: { queryClient }, params: { campId } }) =>
    Promise.all([
      queryClient.ensureQueryData(getMessageReactionOptions({ campId })),
      queryClient.ensureQueryData(getMessagesOptions({ campId })),
    ]),
  component: Camp,
  pendingComponent: LoadingSection,
});

export const profileRoute = createRoute({
  getParentRoute: () => campLayoutRoute,
  path: "/profile",
  component: Profile,
  pendingComponent: LoadingSection,
});


// export const threadRoute = createRoute({
//   getParentRoute: () => campRoute,
//   component: Thread,
//   path: "/$threadId",
//   loader: ({ context: { queryClient }, params: { threadId, campId } }) =>
//     Promise.all([queryClient.ensureQueryData(getThreadsOptions({ campId }))]),
//   pendingComponent: LoadingSection,
// });

// export const whiteboardRoute = createRoute({
//   getParentRoute: () => campRoute,
//   component: WhiteBoard,
//   path: "/$whiteboardId",

//   // loader: ({ context: { queryClient }, params: { threadId, campId } }) =>
//   //   Promise.all([queryClient.ensureQueryData(getThreadsOptions({ campId }))]),
//   pendingComponent: LoadingSection,
// });
