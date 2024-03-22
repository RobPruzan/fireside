import { atom } from "jotai";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { client, promiseDataOrThrow } from "@/edenClient";
import { useToast } from "../ui/use-toast";
import { db } from "@fireside/backend";
import { campMessageLikes, eq } from "@fireside/db"
import {
  FiresideUser,
  useUserQuery,
  userQueryOptions,
} from "@/lib/useUserQuery";
import { useSetAtom } from "jotai";
import { Nullish } from "@fireside/utils";

export const dynamicSideBarOpen = atom(true);
export const createCampModalOpen = atom(false);

export const useDefinedUser = (opts?: Opts) => {
  const user = useSuspenseQuery(userQueryOptions).data;

  const shouldBeDefinedUser = opts?.user ?? user;
  if (!shouldBeDefinedUser) {
    throw new Error(
      "Must ensure at route level user is authorized, or provide a non null user as an argument"
    );
  }

  return shouldBeDefinedUser;
};

type Opts = { user?: FiresideUser };

export const useCreateCampMutation = () => {
  const { toast } = useToast();
  const setModalOpen = useSetAtom(createCampModalOpen);

  const { allCampsQueryKey: allCampsQueryKey } = useAllCamps();
  const { userCampsQueryKey: userCampsQueryKey } = useUserCamps();
  const queryClient = useQueryClient();

  const createCampMutation = useMutation({
    mutationKey: ["create-camp"],
    mutationFn: async (createOps: { name: string }) => {
      const res = await client.api.protected.camp.create.post(createOps);
      console.log("here?");
      if (res.error) {
        throw Error(JSON.stringify(res.error.value));
      }

      return res.data;
    },
    onSuccess: (camp) => {
      console.log("hi", userCampsQueryKey);
      queryClient.setQueryData(userCampsQueryKey, (prev) =>
        prev ? [...prev, camp] : [camp]
      );
      console.log("blug");
      queryClient.setQueryData(allCampsQueryKey, (prev) =>
        prev ? [...prev, camp] : [camp]
      );
      setModalOpen(false);
    },
    onError: (e) => {
      toast({
        title: "Failed to create camp",
        variant: "destructive",
        description: e.message + "\n" + e.stack,
      });
      console.error(e);
    },
  });

  return createCampMutation;
};

export const getUserCampQueryOptions = ({
  userId,
}: {
  userId: Nullish<string>;
}) =>
  queryOptions({
    queryFn: async () => {
      const res = await client.api.protected.camp.retrieve.me.get();
      if (res.error) {
        throw new Error(JSON.stringify(res.error.value));
      }
      return res.data;
    },
    queryKey: ["camps", userId],
    enabled: !!userId,
  });

export const useCampsQuery = () => {
  const user = useUserQuery();

  return useQuery(getUserCampQueryOptions({ userId: user.data?.id }));
};

export const useUserCamps = (opts?: Opts) => {
  const user = useDefinedUser(opts);
  const options = getUserCampQueryOptions({ userId: user.id });
  const userCampsQuery = useSuspenseQuery(options);
  return {
    camps: userCampsQuery.data,
    campsQuery: userCampsQuery,
    userCampsQueryKey: options.queryKey,
  };
};

export const useJoinCampMutation = () => {
  const { toast } = useToast();
  const { allCampsQueryKey } = useAllCamps();
  const { userCampsQueryKey } = useUserCamps();

  const queryClient = useQueryClient();
  const joinCampMutation = useMutation({
    mutationFn: async (joinCampOpts: { campId: string }) =>
      promiseDataOrThrow(
        client.api.protected.camp.join({ campId: joinCampOpts.campId }).post()
      ),
    onError: (e) => {
      toast({
        variant: "destructive",
        title: "Couldn't join camp",
        description: e.message,
      });
    },
    onSuccess: (joinedCamp) => {
      queryClient.setQueryData(userCampsQueryKey, (prev) => {
        return !prev ? [joinedCamp] : [...prev, joinedCamp];
      });
      queryClient.setQueryData(allCampsQueryKey, (prev) => {
        return prev?.map((camp) =>
          camp.id === joinedCamp.id ? { ...camp, count: camp.count + 1 } : camp
        );
      });
    },
  });

  return joinCampMutation;
};

export const getAllCampsQueryOptions = ({ userId }: { userId: string }) =>
  queryOptions({
    queryKey: ["all-camps", userId],
    queryFn: async () =>
      promiseDataOrThrow(client.api.protected.camp.retrieve.get()),
  });
export const useAllCamps = () => {
  const user = useDefinedUser();
  const options = getAllCampsQueryOptions({ userId: user.id });
  const allCampsQuery = useSuspenseQuery(options);

  return {
    camps: allCampsQuery.data,
    allCampsQuery,
    allCampsQueryKey: options.queryKey,
  };
};

export const getMessagesOptions = ({ campId }: { campId: string }) =>
  queryOptions({
    queryKey: ["message", campId],
    queryFn: () =>
      promiseDataOrThrow(
        client.api.protected.camp.message
          .retrieve({
            campId,
          })
          .get()
      ),
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
    mutationFn: (messageInfo: { message: string; createdAt: string }) =>
      promiseDataOrThrow(
        client.api.protected.camp.message.create.post({
          campId,
          ...messageInfo,
        })
      ),
    onMutate: async (variables) => {
      const optimisticMessageId = crypto.randomUUID();
      await queryClient.cancelQueries({
        queryKey: getMessagesOptions({ campId }).queryKey,
      });
      queryClient.setQueryData(messagesQueryKey, (prev) => [
        ...(prev ?? []),
        {
          id: optimisticMessageId,
          campId,
          userId: user.id,
          ...variables,
        },
      ]);
      const previousMessages = queryClient.getQueryData(
        getMessagesOptions({ campId }).queryKey
      );
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

export async function getLikesCountForMessage(messageId : string) {
  try {
    const likesCount = await db
      .select()
      .from(campMessageLikes)
      .where(eq(campMessageLikes.messageId, messageId))

    return likesCount.length; // Return the count as an integer
  } catch (error) {
    console.error('Error getting likes count for message:', error);
    return 0; // Return 0 if there's an error
  }
}
/*
export const likeMessageMutation = ({ campId }: { campId: string }) => {
  const { messagesQueryKey } = useGetMessages({ campId });
  const queryClient = useQueryClient();
  const mutationFuinction = useMutation({
    mutationFn: () =>
        promiseDataOrThrow(messageInfo: { message: string}) =>
          client.api.protected.camp.message.like.post({
            campId,
            ...messageId
          })
        )
  });
  return mutationFuinction;
};*/

