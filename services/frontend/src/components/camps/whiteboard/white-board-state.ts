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
import { run } from "@fireside/utils";

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
    refetchInterval: 10000,
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
  // console.log({ whiteBoardMessagesQuery });
  return {
    whiteBoardMessagesQuery,
    whiteBoardMessages: whiteBoardMessagesQuery.data,
    whiteBoardMessagesQueryKey: options.queryKey,
  };
};

export const getWhiteBoardImagesOptions = ({
  whiteBoardId,
}: {
  whiteBoardId: string;
}) =>
  queryOptions({
    queryKey: ["white-board-images", whiteBoardId],
    refetchInterval: () => 3000,
    queryFn: () =>
      promiseDataOrThrow(
        client.api.protected.whiteboard["whiteboard-image"]
          .retrieve({ whiteBoardId })
          .get()
      ),
    select: (data) =>
      data.map((data) => ({
        ...data,
        image: run(() => {
          const image = new Image(200, 200);
          image.src = data.imgUrl;
          return image;
        }),
      })),
  });
