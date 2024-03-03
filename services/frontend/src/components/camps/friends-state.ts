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
import { makeArrayOptimisticUpdater } from "@/lib/utils";
import { FriendRequest } from "@fireside/db";
import { useToast } from "../ui/use-toast";
import { FiresideUser } from "@/lib/useUserQuery";

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
  return {
    friendRequests: requestsQuery.data ?? [],
    query: requestsQuery,
    friendRequestsUpdater: makeArrayOptimisticUpdater<FriendRequest>({
      queryClient,
      queryKey: options.queryKey,
    }),
  };
};

export const useMakeFriendRequestMutation = () => {
  const { toast } = useToast();

  const { friendRequestsUpdater } = useGetUserFriendRequests();

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
    onSuccess: (newFriendRequest) => {
      friendRequestsUpdater((prev) =>
        !prev ? [newFriendRequest] : [...prev, newFriendRequest]
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

  return {
    users: usersQuery.data ?? [],
    query: usersQuery,
    optimisticUsersUpdater: makeArrayOptimisticUpdater({
      queryClient,
      queryKey: usersQueryOptions.queryKey,
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
    optimisticFriendsUpdate: makeArrayOptimisticUpdater<FiresideUser>({
      queryClient: queryClient,
      queryKey: options.queryKey,
    }),
  };
};

export const useAcceptFriendRequestMutation = () => {
  const { toast } = useToast();

  const { optimisticFriendsUpdate } = useGetFriends();

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
    onSuccess: (newFriend) => {
      optimisticFriendsUpdate((prev) =>
        prev ? [...prev, newFriend] : [newFriend]
      );
    },
  });

  return acceptFriendRequestMutation;
};
