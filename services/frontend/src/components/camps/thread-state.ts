import { client, promiseDataOrThrow } from "@/edenClient";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useDefinedUser } from "./camps-state";
import { useToast } from "../ui/use-toast";

export const getThreadsOptions = ({ campId }: { campId: string }) =>
  queryOptions({
    queryKey: ["threads", campId],
    queryFn: () =>
      promiseDataOrThrow(
        client.api.protected.thread.retrieve({ campId }).get()
      ),
  });

export const useGetThreads = ({ campId }: { campId: string }) => {
  const options = getThreadsOptions({
    campId,
  });

  const getThreadsQuery = useSuspenseQuery(options);

  return {
    threads: getThreadsQuery.data,
    getThreadsQuery,
    getThreadsQueryKey: options.queryKey,
  };
};

export const useCreateThread = ({ campId }: { campId: string }) => {
  const { getThreadsQueryKey } = useGetThreads({ campId });
  const queryClient = useQueryClient();
  const createThreadMutation = useMutation({
    mutationFn: ({ parentMessageId }: { parentMessageId: string }) =>
      promiseDataOrThrow(
        client.api.protected.thread.create({ parentMessageId }).post()
      ),

    onSuccess: (data) => {
      queryClient.setQueryData(getThreadsQueryKey, (prev) => [
        ...(prev ?? []),
        data,
      ]);
    },
  });

  return createThreadMutation;
};
export const getThreadMessagesOptions = ({ threadId }: { threadId: string }) =>
  queryOptions({
    refetchInterval: 1500,
    queryKey: ["thread-messages", threadId],
    queryFn: () =>
      promiseDataOrThrow(
        client.api.protected.thread({ threadId }).message.retrieve.get()
      ),
  });
export const useGetThreadMessages = ({ threadId }: { threadId: string }) => {
  const options = getThreadMessagesOptions({
    threadId,
  });
  const threadMessagesQuery = useSuspenseQuery(options);

  return {
    threadsQuery: threadMessagesQuery,
    threadMessagesQueryKey: options.queryKey,
    threadMessages: threadMessagesQuery.data,
  };
};

export const useCreateThreadMessageMutation = ({
  threadId,
}: {
  threadId: string;
}) => {
  const options = getThreadMessagesOptions({
    threadId,
  });
  const user = useDefinedUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createThreadMessageMutation = useMutation({
    mutationFn: ({
      message,
      id,
      createdAt,
    }: {
      message: string;
      id: string;
      createdAt: string;
    }) =>
      client.api.protected.thread({ threadId }).message.create.post({
        message,
        id,
        createdAt,
      }),

    onMutate: async (variables) => {
      await queryClient.cancelQueries(options);

      const previousMessages = queryClient.getQueryData(options.queryKey);

      queryClient.setQueryData(options.queryKey, (prev) => [
        ...(prev ?? []),
        {
          ...variables,
          userId: user.id,
          user,
          threadId,
        },
      ]);

      return { previousMessages };
    },

    onError: (e, _, ctx) => {
      toast({
        title: "Could not send message",
        description: e.message,
      });
    },
  });

  return createThreadMessageMutation;
};
