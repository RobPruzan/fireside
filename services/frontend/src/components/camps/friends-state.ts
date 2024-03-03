// export const useSendFriendRequestMutation = useMutation({
//   mutationFn: () => {
//     const newFriendRequest
//   }
// })

import { client } from "@/edenClient";
import {
  UseQueryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useDefinedUser } from "./camps-state";
import {
  getNotMeUser,
  getNotMeUserId,
  makeArrayOptimisticUpdater,
} from "@/lib/utils";
import { Friend, FriendRequest } from "@fireside/db";
import { useToast } from "../ui/use-toast";
import { FiresideUser } from "@/lib/useUserQuery";
import { InsideArray, InsidePromise, run } from "@fireside/utils";

export const getFriendRequestsQueryOptions = ({ userId }: { userId: string }) =>
  ({
    queryKey: ["friend-requests", userId],
    queryFn: async () => {
      const res = await client.protected.user.friends.request.retrieve.get();
      if (res.error) {
        throw new Error(res.error.value);
      }
      return res.data;
    },
    enabled: !!userId,
  } satisfies UseQueryOptions);
export const useGetUserFriendRequests = () => {
  const user = useDefinedUser();
  const queryClient = useQueryClient();
  const options = getFriendRequestsQueryOptions({ userId: user.id });
  const requestsQuery = useSuspenseQuery(options);
  const { friends } = useGetFriends();

  type test = InsidePromise<ReturnType<typeof options.queryFn>>;
  return {
    friendRequests: requestsQuery.data ?? [],
    openFriendRequests: (requestsQuery.data ?? [])
      .filter(({ deleted, fromUserId }) => !deleted && fromUserId !== user.id)
      .filter(
        ({ fromUserId }) =>
          !friends.some(
            ({ friend: { userOneId, userTwoId } }) =>
              fromUserId === userOneId || fromUserId === userTwoId
          )
      ),
    query: requestsQuery,
    optimisticFriendRequestsUpdater: makeArrayOptimisticUpdater({
      queryClient,
      options,
    }),
  };
};

export const useMakeFriendRequestMutation = () => {
  const { toast } = useToast();

  const { optimisticFriendRequestsUpdater, friendRequests } =
    useGetUserFriendRequests();

  const { optimisticFriendsUpdate } = useGetFriends();

  const makeFriendRequestMutation = useMutation({
    mutationFn: async (makeFriendRequestOpts: { to: string }) => {
      const res = await client.protected.user.friends.request[
        makeFriendRequestOpts.to
      ].post();
      if (res.error) {
        throw new Error(res.error.value);
      }

      return res.data;
    },
    onError: (e) =>
      toast({
        variant: "destructive",
        title: "Could not make friend request",
        description: e.message,
      }),
    onSuccess: (result) => {
      if (result.kind === "created-friend") {
        optimisticFriendsUpdate((prev) => {
          if (
            friendRequests.some(
              (request) => request.fromUserId === result.otherUser.id
            )
          ) {
            return [...prev, result];
          }

          return prev;
        });

        optimisticFriendRequestsUpdater((prev) =>
          !prev
            ? [result.existingRequest]
            : [...prev, result.existingRequest].map((request) => ({
                ...request,
                deleted: request.deleted
                  ? true
                  : result.existingRequest.id === request.id,
              }))
        );

        return;
      }

      optimisticFriendRequestsUpdater((prev) =>
        !prev ? [result.newFriendRequest] : [...prev, result.newFriendRequest]
      );
    },
  });

  return makeFriendRequestMutation;
};

export const usersQueryOptions = {
  queryKey: ["get-users"],
  queryFn: async () => {
    const res = await client.protected.user["get-all"].get();
    if (res.error) {
      throw new Error(res.error.value);
    }

    return res.data;
  },
} satisfies UseQueryOptions;

export const useGetUsers = () => {
  const usersQuery = useSuspenseQuery(usersQueryOptions);
  const queryClient = useQueryClient();
  const { friends } = useGetFriends();
  const { friendRequests } = useGetUserFriendRequests();
  return {
    users: usersQuery.data ?? [],
    usersWithStatus: (usersQuery.data ?? []).map((externalUser) => ({
      ...externalUser,
      status: run(() => {
        const sentRequest = friendRequests.some(
          ({ toUserId }) => toUserId === externalUser.id
        );

        const isFriend = friends.some(
          (friend) =>
            friend.otherUser.id === externalUser.id ||
            friend.user.id === externalUser.id
        );

        if (isFriend) return "is-friend" as const;
        if (sentRequest) return "sent-request" as const;
        return "no-relation" as const;
      }),
    })),
    query: usersQuery,
    optimisticUsersUpdater: makeArrayOptimisticUpdater({
      queryClient,
      options: usersQueryOptions,
    }),
  };
};

export const getFriendsQueryOptions = ({ userId }: { userId: string }) =>
  ({
    queryKey: ["friends", userId],
    queryFn: async () => {
      const res = await client.protected.user.friends.retrieve.get();

      if (res.error) {
        throw new Error(res.error.value);
      }

      return res.data;
    },
  } satisfies UseQueryOptions);

export const useGetFriends = () => {
  const user = useDefinedUser();

  const queryClient = useQueryClient();
  const options = getFriendsQueryOptions({ userId: user.id });
  const friendsQuery = useSuspenseQuery(
    getFriendsQueryOptions({ userId: user.id })
  );

  return {
    friends: friendsQuery.data ?? [],
    query: friendsQuery,
    optimisticFriendsUpdate: makeArrayOptimisticUpdater({
      queryClient,
      options,
    }),
  };
};

export const useAcceptFriendRequestMutation = () => {
  const { toast } = useToast();

  const { optimisticFriendsUpdate } = useGetFriends();

  const { optimisticFriendRequestsUpdater } = useGetUserFriendRequests();
  const user = useDefinedUser();
  const acceptFriendRequestMutation = useMutation({
    mutationFn: async ({ requestId }: { requestId: string }) => {
      const res = await client.protected.user.friends.request.accept[
        requestId
      ].post();
      if (res.error) {
        throw new Error(res.error.value);
      }

      return res.data;
    },

    onError: (e) => {
      toast({
        variant: "destructive",
        title: "Could not accept friend request",
        description: e.message,
      });
    },
    onSuccess: (data) => {
      const createdFriendUserId =
        user.id === data.friend.userOneId
          ? data.friend.userTwoId
          : data.friend.userOneId;
      optimisticFriendsUpdate((prev) => (prev ? [...prev, data] : [data]));
      optimisticFriendRequestsUpdater((prev) =>
        prev.map((request) => {
          if (createdFriendUserId === request.fromUserId) {
            return {
              ...request,
              deleted: true,
            };
          }

          return request;
        })
      );
      toast({
        title: "Request accepted!",
      });
    },
  });

  return acceptFriendRequestMutation;
};
