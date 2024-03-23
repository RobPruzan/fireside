import { client, promiseDataOrThrow } from "@/edenClient";
import {
  queryOptions,
  useSuspenseQuery,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import { useToast } from "../ui/use-toast";
import { useDefinedUser } from "./camps-state";
import { queryClient } from "@/query";

export const getMessagesOptions = ({ campId }: { campId: string }) =>
  queryOptions({
    queryKey: ["message", campId],
    queryFn: async () => {
      const res = await client.api.protected.message
        .retrieve({
          campId,
        })
        .get();
      console.log({ res });

      return promiseDataOrThrow(
        client.api.protected.message
          .retrieve({
            campId,
          })
          .get()
      );
    },
    refetchInterval: 5000,
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
  const createMessageMutation = useMutation({
    mutationFn: (messageInfo: {
      message: string;
      createdAt: string;
      parentMessageId: string | null;
    }) =>
      promiseDataOrThrow(
        client.api.protected.message.create.post({
          campId,
          ...messageInfo,
        })
      ),
    onMutate: async (variables) => {
      const optimisticMessageId = crypto.randomUUID();
      await queryClient.cancelQueries({
        queryKey: getMessagesOptions({ campId }).queryKey,
      });
      const previousMessages = queryClient.getQueryData(
        getMessagesOptions({ campId }).queryKey
      );
      queryClient.setQueryData(messagesQueryKey, (prev) => [
        ...(prev ?? []),
        {
          id: optimisticMessageId,
          campId,
          userId: user.id,
          user,
          ...variables,
        },
      ]);

      return { optimisticMessageId, previousMessages };
    },

    onError: (e, _, ctx) => {
      toast({
        variant: "destructive",
        title: "Failed to send message.",
        description: e.message,
      });

      queryClient.setQueryData(messagesQueryKey, ctx?.previousMessages ?? []);
    },
    onSuccess: (data, _, ctx) => {
      queryClient.setQueryData(messagesQueryKey, (prev) =>
        [...(prev ?? []), data].filter(
          ({ id }) => id !== ctx.optimisticMessageId
        )
      );
    },
  });

  return createMessageMutation;
};

export const getMessageReactionOptions = ({ campId }: { campId: string }) =>
  queryOptions({
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
      reactionId,
      messageId,
    }: {
      reactionId: string;
      messageId: string;
    }) =>
      client.api.protected.message.react({ reactionId })({ messageId }).post(),

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
            id: newReactionId,
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
