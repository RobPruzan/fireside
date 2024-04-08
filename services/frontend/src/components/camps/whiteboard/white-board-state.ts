import { client, promiseDataOrThrow } from "@/edenClient";
import { MessageWhiteBoardInsertSchema } from "@fireside/db";
import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { promise } from "zod";
import { useDefinedUser } from "../camps-state";

export const useCreateWhiteBoardMutation = () =>
  useMutation({
    mutationFn: ({ whiteBoardId }: { whiteBoardId: string }) =>
      client.api.protected.whiteboard.create.post({ id: whiteBoardId }),
  });

export const useCreateWhiteBoardMessageMutation = ({
  campId,
}: {
  campId: string;
}) => {
  const { whiteBoardMessagesQueryKey } = useGetWhiteBoardMessages({ campId });

  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      body: Omit<MessageWhiteBoardInsertSchema, "id"> & { id: string }
    ) => client.api.protected.whiteboard.message.create.post(body),

    onSuccess: (_, variables) => {
      queryClient.setQueryData(whiteBoardMessagesQueryKey, (prev) => [
        ...(prev ?? []),
        variables,
      ]);
    },
  });
};

export const getMessageWhiteBoardsOptions = ({ campId }: { campId: string }) =>
  queryOptions({
    queryKey: ["message-whiteboards", campId],
    queryFn: () =>
      promiseDataOrThrow(
        client.api.protected.whiteboard.message.retrieve({ campId }).get()
      ),
  });

export const useGetWhiteBoardMessages = ({ campId }: { campId: string }) => {
  const options = getMessageWhiteBoardsOptions({
    campId,
  });
  const whiteBoardMessagesQuery = useSuspenseQuery(options);

  return {
    whiteBoardMessagesQuery,
    whiteBoardMessages: whiteBoardMessagesQuery.data,
    whiteBoardMessagesQueryKey: options.queryKey,
  };
};
