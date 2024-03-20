import { atom } from "jotai";
import {
  UseQueryOptions,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { client, dataOrThrow, promiseDataOrThrow } from "@/edenClient";
import { useToast } from "../ui/use-toast";

import {
  FiresideUser,
  useUserQuery,
  userQueryOptions,
} from "@/lib/useUserQuery";
import { useSetAtom } from "jotai";
import { Nullish } from "@fireside/utils";
import { CampMessage, FiresideCamp } from "@fireside/db";

import { makeOptimisticUpdater } from "@/lib/utils";
import {
  persistQueryClient,
  persistQueryClientSave,
} from "@tanstack/react-query-persist-client";
import { persister, queryClient as globalQueryClient } from "@/query";

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

  const { queryKey: allCampsQueryKey } = useAllCamps();
  const { queryKey: userCampsQueryKey } = useUserCamps();
  const { setQueryData } = useQueryClient();

  const createCampMutation = useMutation({
    mutationKey: ["create-camp"],
    mutationFn: async (createOps: { name: string }) => {
      const res = await client.api.protected.camp.create.post(createOps);
      if (res.error) {
        throw Error(JSON.stringify(res.error.value));
      }

      return res.data;
    },
    onSuccess: (camp) => {
      setQueryData(userCampsQueryKey, (prev) =>
        prev ? [...prev, camp] : [camp]
      );
      setQueryData(allCampsQueryKey, (prev) =>
        prev ? [...prev, camp] : [camp]
      );
      setModalOpen(false);
    },
    onError: () =>
      toast({ title: "Failed to create camp", variant: "destructive" }),
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
  const queryClient = useQueryClient();
  const campsQuery = useSuspenseQuery(options);
  return {
    camps: campsQuery.data,
    query: campsQuery,

    queryKey: options.queryKey,
  };
};

export const useJoinCampMutation = () => {
  const { toast } = useToast();
  const { queryKey: campsQueryKey } = useAllCamps();
  const { queryKey: userCampsQueryKey } = useUserCamps();

  const { setQueryData } = useQueryClient();
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
      setQueryData(userCampsQueryKey, (prev) => {
        return !prev ? [joinedCamp] : [...prev, joinedCamp];
      });
      setQueryData(campsQueryKey, (prev) => {
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
    query: allCampsQuery,
    queryKey: options.queryKey,
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
  const options = {
    queryKey: ["messages", campId],
    queryFn: () =>
      promiseDataOrThrow(
        client.api.protected.camp.message
          .retrieve({
            campId,
          })
          .get()
      ),
    refetchInterval: 5000,
  };

  const messagesQuery = useSuspenseQuery(options);
  const queryClient = useQueryClient();

  return {
    messagesQuery,
    messages: messagesQuery.data,
    messagesUpdater: makeOptimisticUpdater({
      options,
      queryClient,
    }),
  };
};

export const useCreateMessageMutation = ({ campId }: { campId: string }) => {
  const { toast } = useToast();

  const { messagesUpdater } = useGetMessages({ campId });
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
      messagesUpdater((prev) => [
        ...prev,
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

      messagesUpdater(ctx?.previousMessages ?? []);
    },
    onSuccess: (data, _, ctx) => {
      messagesUpdater((prev) =>
        [...prev, data].filter(({ id }) => id !== ctx.optimisticMessageId)
      );
    },
  });

  return createMessageMutation;
};
