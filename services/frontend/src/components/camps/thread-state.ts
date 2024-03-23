import { client, promiseDataOrThrow } from "@/edenClient";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

export const getThreadMessagesOptions = ({ threadId }: { threadId: string }) =>
  queryOptions({
    queryFn: () =>
      promiseDataOrThrow(
        client.api.protected.thread({ threadId }).message.retrieve.get()
      ),
    queryKey: ["thread-messages", threadId],
  });

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
