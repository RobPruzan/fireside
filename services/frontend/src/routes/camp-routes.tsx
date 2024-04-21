import { Camp } from "@/components/camps/Camp";
import { Explore } from "@/components/camps/Explore";
import { Friends } from "@/components/camps/Friends";
import { RootCampLayout } from "@/components/camps/RootCampLayout";
import {
  getUserCampQueryOptions,
  getAllCampsQueryOptions,
  useGetTranscriptionGroup,
} from "@/components/camps/camps-state";
import {
  getFriendRequestsQueryOptions,
  usersQueryOptions,
} from "@/components/camps/friends-state";
import { LoadingScreen, LoadingSection } from "@/components/ui/loading";

import { ErrorComponent, createRoute, useParams } from "@tanstack/react-router";

import { authRootLayout } from "./layouts";
import { Inbox } from "@/components/camps/Inbox";
import {
  getCampOptions,
  getMessageReactionOptions,
  getMessagesOptions,
  reactionAssetsOptions,
} from "@/components/camps/message-state";
import { Thread } from "@/components/camps/Thread";
import { promise, z } from "zod";
import { getThreadsOptions } from "@/components/camps/thread-state";
import { getMessageWhiteBoardsOptions } from "@/components/camps/whiteboard/white-board-state";
import { AudioManager } from "@/lib/transcription/components/AudioManager";

import Transcript from "@/lib/transcription/components/Transcript";
import {
  TranscriberContext,
  useTranscriber,
} from "@/lib/transcription/hooks/useTranscriber";
import { client } from "@/edenClient";
import { useState, useEffect, useRef } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
// import { WhiteBoard } from "@/components/camps/whiteboard/WhiteBoard";
const foo = client.api.protected.camp.transcribe({ groupId: "..." }).subscribe;

type TranscriptionSubscription = ReturnType<typeof foo>;
export const campLayoutRoute = createRoute({
  getParentRoute: () => authRootLayout,
  validateSearch: (search) =>
    z
      .object({
        threadId: z.string().optional(),
        whiteBoardId: z.string().optional(),
        transcriptionGroupId: z.string().optional(),
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
  // component: RootCampLayout,
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
  // errorComponent: ({}) => {},

  loader: ({ context: { queryClient }, params: { campId } }) =>
    Promise.all([
      queryClient.ensureQueryData(getMessageReactionOptions({ campId })),
      queryClient.ensureQueryData(getMessagesOptions({ campId })),
      queryClient.ensureQueryData(getMessageWhiteBoardsOptions({ campId })),
      queryClient.ensureQueryData(getCampOptions({ campId })),
    ]),
  // component: Camp,
  component: () => {
    const transcriptionSubscriptionRef =
      useRef<TranscriptionSubscription | null>(null);
    const { campId } = useParams({
      from: "/root-auth/camp-layout/camp/$campId",
    });
    const { transcriptionGroup } = useGetTranscriptionGroup({ campId });

    useEffect(() => {
      if (!transcriptionGroup) {
        console.log("debug here");
        return;
      }
      transcriptionSubscriptionRef.current = client.api.protected.camp
        .transcribe({ groupId: transcriptionGroup.id })
        .subscribe();
    }, [transcriptionGroup]);
    const transcriber = useTranscriber({
      onTranscribe: ({ text, lastTimeStamp }) => {
        console.log("TRANSCRIPTION", lastTimeStamp, text);

        transcriptionSubscriptionRef.current?.send({
          jobId: crypto.randomUUID(), // useful if we take the chunks that come in
          text,
        });
      },
    });
    return (
      <TranscriberContext.Provider
        value={{
          transcriber,
        }}
      >
        <ErrorBoundary
          fallbackRender={({ resetErrorBoundary }) => (
            <div className="w-full h-full text-2xl font-bold text-red-500 flex items-center justify-center gap-x-2">
              Recoverable error occurred{" "}
              <Button
                onClick={() => {
                  resetErrorBoundary();
                }}
              >
                Reload
              </Button>
            </div>
          )}
        >
          <Camp />
        </ErrorBoundary>
      </TranscriberContext.Provider>
    );
  },
  pendingComponent: LoadingSection,
});

export const campRouteTree = campLayoutRoute.addChildren([
  exploreRoute,
  campRoute,
  friendsRoute,
  inboxRoute,
  // audioRoute,
]);
