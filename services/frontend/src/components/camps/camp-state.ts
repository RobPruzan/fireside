import { atom } from "jotai";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { client } from "@/edenClient";
import { useToast } from "../ui/use-toast";

import { FiresideCamp } from "../../../../db/src";
import { getCampQueryOptions } from "@/lib/useCampsQuery";
import { FiresideUser, userQueryOptions } from "@/lib/useUserQuery";
import { useSetAtom } from "jotai";

export const dynamicSideBarOpen = atom(true);
export const createCampModalOpen = atom(false);

export const useDefinedUser = (opts?: { user?: FiresideUser }) => {
  const user = useSuspenseQuery(userQueryOptions).data;

  const shouldBeDefinedUser = opts?.user ?? user;
  if (!shouldBeDefinedUser) {
    throw new Error(
      "Must ensure at route level user is authorized, or provide a non null user as an argument"
    );
  }

  return shouldBeDefinedUser;
};

export const useCreateCampMutation = (opts?: { user?: FiresideUser }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const user = useDefinedUser(opts);

  const setModalOpen = useSetAtom(createCampModalOpen);

  const createCampMutation = useMutation({
    mutationKey: ["create-camp"],
    mutationFn: async (createOps: { name: string }) => {
      const res = await client.protected.camp.create.post(createOps);
      if (res.error) {
        throw Error(res.error.value);
      }

      return res.data;
    },
    onSuccess: (camp) => {
      queryClient.setQueryData<Array<FiresideCamp>>(
        getCampQueryOptions({ userId: user.id }).queryKey,
        (prev) => [...(prev ?? []), camp]
      );
      setModalOpen(false);
    },
    onError: () =>
      toast({ title: "Failed to create camp", variant: "destructive" }),
  });

  return createCampMutation;
};

export const useCamps = (opts?: { user?: FiresideUser }) => {
  const user = useDefinedUser(opts);
  const campsQuery = useSuspenseQuery(getCampQueryOptions({ userId: user.id }));
  return { camps: campsQuery.data, query: campsQuery };
};
