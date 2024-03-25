import { client, promiseDataOrThrow } from "@/edenClient";
import {
  useSuspenseQuery,
  useQueryClient,
  useMutation,
  queryOptions,
} from "@tanstack/react-query";
import { useToast } from "../ui/use-toast";
import { useDefinedUser } from "./camps-state";
import { queryClient } from "@/query";
import { useGetThreads } from "./thread-state";

export const getMessagesOptions = ({ campId }: { campId: string }) =>
  queryOptions({
    queryKey: ["message", campId],
    queryFn: async () => {
      const res = await client.api.protected.message
        .retrieve({
          campId,
        })
        .get();
      return promiseDataOrThrow(
        client.api.protected.message
          .retrieve({
            campId,
          })
          .get()
      );
    },
    refetchInterval: 1500,
  });

export const useGetMessages = ({ campId }: { campId: string }) => {
  const options = getMessagesOptions({ campId });
  const messagesQuery = useSuspenseQuery(options);
  return {
    messagesQuery,
    messages: messagesQuery.data,
    messagesQueryKey: options.queryKey,
  };
};

export const useCreateMessageMutation = ({ campId }: { campId: string }) => {
  const { toast } = useToast();
  const { messagesQueryKey } = useGetMessages({ campId });
  const user = useDefinedUser();
  const queryClient = useQueryClient();
  const { getThreadsQueryKey } = useGetThreads({ campId });
  const createMessageMutation = useMutation({
    mutationFn: (messageInfo: {
      message: string;
      createdAt: string;
      id: string;
    }) =>
      promiseDataOrThrow(
        client.api.protected.message.create.post({
          campId,
          ...messageInfo,
        })
      ),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: getMessagesOptions({ campId }).queryKey,
      });
      const previousMessages = queryClient.getQueryData(
        getMessagesOptions({ campId }).queryKey
      );
      queryClient.setQueryData(messagesQueryKey, (prev) => [
        ...(prev ?? []),
        {
          campId,
          userId: user.id,
          user,
          ...variables,
        },
      ]);

      return { previousMessages };
    },

    onError: (e, _, ctx) => {
      toast({
        variant: "destructive",
        title: "Failed to send message.",
        description: e.message,
      });

      queryClient.setQueryData(messagesQueryKey, ctx?.previousMessages ?? []);
    },

    onSuccess: (data) => {
      queryClient.setQueryData(getThreadsQueryKey, (prev) => [
        ...(prev ?? []),
        { ...data.thread, campId },
      ]);
    },
  });

  return createMessageMutation;
};

export const getMessageReactionOptions = ({ campId }: { campId: string }) =>
  queryOptions({
    refetchInterval: 1500,
    queryKey: ["message-reactions", campId],
    queryFn: () =>
      promiseDataOrThrow(
        client.api.protected.message.react.retrieve({ campId }).get()
      ),
  });
export const useGetMessageReactions = ({ campId }: { campId: string }) => {
  const options = getMessageReactionOptions({ campId });

  const messageReactionsQuery = useSuspenseQuery(options);

  return {
    messageReactionsQuery,
    messageReactions: messageReactionsQuery.data,
    messageReactionsQueryKey: options.queryKey,
  };
};

export const useReactToMessageMutation = ({ campId }: { campId: string }) => {
  const user = useDefinedUser();
  const queryClient = useQueryClient();
  const messageReactionsQueryOptions = getMessageReactionOptions({
    campId,
  });
  const { toast } = useToast();
  const reactToMessageMutation = useMutation({
    mutationFn: ({
      reactionAssetId,
      messageId,
      id,
    }: {
      reactionAssetId: string;
      messageId: string;
      id: string;
    }) =>
      client.api.protected.message
        .react({ reactionAssetId })({ messageId })
        .post({
          id,
        }),

    onMutate: async (variables) => {
      await queryClient.cancelQueries(messageReactionsQueryOptions);

      const previousReactions = queryClient.getQueryData(
        messageReactionsQueryOptions.queryKey
      );

      const newReactionId = crypto.randomUUID();

      queryClient.setQueryData(
        messageReactionsQueryOptions.queryKey,
        (prev) => [
          ...(prev ?? []),
          {
            campId,

            createdAt: new Date().toISOString(),
            ...variables,
            userId: user.id,
          },
        ]
      );

      return {
        previousReactions,
        newReactionId,
      };
    },
    onError: (error, _, ctx) => {
      queryClient.setQueryData(messageReactionsQueryOptions.queryKey, (prev) =>
        prev?.filter((reaction) => reaction.id !== ctx?.newReactionId)
      );
      toast({
        variant: "destructive",
        title: "Failed to react",
        description: error.message,
      });
    },
  });

  return reactToMessageMutation;
};

export const reactionAssetsOptions = queryOptions({
  queryKey: ["reactions"],
  queryFn: () =>
    promiseDataOrThrow(client.api.protected.message.assets.react.get()),
});

export const useGetReactionAssets = () => {
  const reactionAssetsQuery = useSuspenseQuery(reactionAssetsOptions);

  return {
    reactionAssetsQueryKey: reactionAssetsOptions.queryKey,
    reactionAssets: reactionAssetsQuery.data,
    reactionAssetsQuery,
  };
};

export const useRemoveReactionMutation = ({ campId }: { campId: string }) => {
  const queryClient = useQueryClient();
  const messageReactionsQueryOptions = getMessageReactionOptions({
    campId,
  });
  const { toast } = useToast();

  const removeReactionMutation = useMutation({
    mutationFn: ({ reactionId }: { reactionId: string }) =>
      client.api.protected.message.react.remove({ reactionId }).post(),
    onMutate: async (variables) => {
      await queryClient.cancelQueries(messageReactionsQueryOptions);

      const previousReactions = queryClient.getQueryData(
        messageReactionsQueryOptions.queryKey
      );

      queryClient.setQueryData(messageReactionsQueryOptions.queryKey, (prev) =>
        prev?.filter(({ id }) => id !== variables.reactionId)
      );

      return { previousReactions };
    },

    onError: (error, _, ctx) => {
      toast({
        title: "Failed to remove reaction",
        description: error.message,
      });

      queryClient.setQueryData(
        messageReactionsQueryOptions.queryKey,
        ctx?.previousReactions
      );
    },
  });

  return removeReactionMutation;
};
