import { client, promiseDataOrThrow } from "@/edenClient";
import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useDefinedUser } from "./camps-state";
import { useToast } from "../ui/use-toast";
import { run } from "@fireside/utils";

export const getFriendRequestsQueryOptions = ({ userId }: { userId: string }) =>
  queryOptions({
    queryKey: ["friend-requests", userId],
    queryFn: () =>
      promiseDataOrThrow(client.api.protected.friend.request.retrieve.get()),
    enabled: !!userId,
  });

export const useGetUserFriendRequests = () => {
  const user = useDefinedUser();
  const options = getFriendRequestsQueryOptions({ userId: user.id });
  const requestsQuery = useSuspenseQuery(options);
  const { friends } = useGetFriends();

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
    requestsQuery,
    requestsQueryKey: options.queryKey,
  };
};

export const useMakeFriendRequestMutation = () => {
  const { toast } = useToast();

  const { requestsQueryKey: getFriendRequestsQueryKey, friendRequests } =
    useGetUserFriendRequests();
  const queryClient = useQueryClient();
  const { friendsQueryKey: getFriendsQueryKey } = useGetFriends();

  const makeFriendRequestMutation = useMutation({
    mutationFn: (makeFriendRequestOpts: { to: string }) =>
      promiseDataOrThrow(
        client.api.protected.friend
          .request({ to: makeFriendRequestOpts.to })
          .post()
      ),
    onError: (e) =>
      toast({
        variant: "destructive",
        title: "Could not make friend request",
        description: e.message,
      }),
    onSuccess: (result) => {
      if (result.kind === "created-friend") {
        queryClient.setQueryData(getFriendsQueryKey, (prev) => {
          if (
            friendRequests.some(
              (request) => request.fromUserId === result.otherUser.id
            )
          ) {
            return [...(prev ?? []), result];
          }

          return prev;
        });

        queryClient.setQueryData(getFriendRequestsQueryKey, (prev) =>
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

      queryClient.setQueryData(getFriendRequestsQueryKey, (prev) =>
        !prev ? [result.newFriendRequest] : [...prev, result.newFriendRequest]
      );
    },
  });

  return makeFriendRequestMutation;
};

export const usersQueryOptions = queryOptions({
  queryKey: ["get-users"],
  queryFn: () => promiseDataOrThrow(client.api.protected.user["get-all"].get()),
});

export const useGetUsers = () => {
  const usersQuery = useSuspenseQuery(usersQueryOptions);
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
    usersQuery,
    usersQueryKey: usersQueryOptions.queryKey,
  };
};

export const getFriendsQueryOptions = ({ userId }: { userId: string }) =>
  queryOptions({
    queryKey: ["friends", userId],
    queryFn: () =>
      promiseDataOrThrow(client.api.protected.friend.retrieve.get()),
  });

export const useGetFriends = () => {
  const user = useDefinedUser();
  const options = getFriendsQueryOptions({ userId: user.id });
  const friendsQuery = useSuspenseQuery(
    getFriendsQueryOptions({ userId: user.id })
  );

  return {
    friends: friendsQuery.data ?? [],
    friendsQuery,
    friendsQueryKey: options.queryKey,
  };
};

export const useAcceptFriendRequestMutation = () => {
  const { toast } = useToast();

  const { friendsQueryKey } = useGetFriends();
  const queryClient = useQueryClient();
  const { requestsQueryKey } = useGetUserFriendRequests();
  const user = useDefinedUser();
  const acceptFriendRequestMutation = useMutation({
    mutationFn: ({ requestId }: { requestId: string }) =>
      promiseDataOrThrow(
        client.api.protected.friend.request
          .accept({ requestId: requestId })
          .post()
      ),

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
      queryClient.setQueryData(friendsQueryKey, (prev) =>
        prev ? [...prev, data] : [data]
      );
      queryClient.setQueryData(requestsQueryKey, (prev) =>
        (prev ?? []).map((request) => {
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
