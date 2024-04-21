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

import {
  FiresideUser,
  useUserQuery,
  userQueryOptions,
} from "@/lib/useUserQuery";
import { useSetAtom } from "jotai";
import { Nullish } from "@fireside/utils";
import { redirect } from "@tanstack/react-router";

export const dynamicSideBarOpen = atom(
  visualViewport && visualViewport.width > 900
);
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
    mutationFn: async (createOps: { name: string; createdBy: string }) => {
      const res = await client.api.protected.camp.create.post(createOps);

      if (res.error) {
        throw Error(JSON.stringify(res.error.value));
      }

      return res.data;
    },
    onSuccess: (camp) => {
      queryClient.setQueryData(userCampsQueryKey, (prev) =>
        prev ? [...prev, camp] : [camp]
      );

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

export const getTranscriptionGroupOptions = ({ campId }: { campId: string }) =>
  queryOptions({
    refetchInterval: 5000,
    queryKey: ["transcription-group", campId],
    queryFn: () =>
      promiseDataOrThrow(
        client.api.protected.camp.transcribe.group.retrieve({ campId }).get()
      ),
  });

export const useGetTranscriptionGroup = ({ campId }: { campId: string }) => {
  const options = getTranscriptionGroupOptions({ campId });

  const transcriptionGroupQuery = useSuspenseQuery(options);

  return {
    transcriptionGroup: transcriptionGroupQuery.data as Nullish<
      typeof transcriptionGroupQuery.data
    >,
    transcriptionGroupQuery,
    transcriptionGroupQueryKey: options.queryKey,
  };
};

export const useCreateTranscriptionGroup = () => {
  return useMutation({
    mutationFn: ({ campId }: { campId: string }) =>
      client.api.protected.camp.transcribe.group.create({ campId }).post(),
  });
};

export const getGroupTranscriptionOptions = ({
  groupId,
  enabled = true,
}: {
  groupId: string;
  enabled?: boolean;
}) => {
  return queryOptions({
    enabled,
    queryKey: ["group-transcriptions", groupId],
    queryFn: () =>
      enabled
        ? promiseDataOrThrow(
            client.api.protected.camp.transcribe.retrieve({ groupId }).get()
          ).then((data) => data.map(({ transcription }) => transcription))
        : null,

    // select: (data) => data.map(({ transcription }) => transcription.text),
  });
};

export const useGetTranscription = ({
  groupId,
  enabled = true,
}: {
  groupId: string;
  enabled?: boolean;
}) => {
  const transcriptionQueryOptions = getGroupTranscriptionOptions({
    groupId,
    enabled,
  });

  const transcriptionQuery = useSuspenseQuery(transcriptionQueryOptions);

  return {
    transcriptionQuery,
    transcriptionQueryKey: transcriptionQueryOptions.queryKey,
    transcription: transcriptionQuery.data,
  };
};

export const transcribeAudio = atom(true);
