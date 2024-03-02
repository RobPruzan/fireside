import { client } from "@/edenClient";
import { QueryOptions, useQuery } from "@tanstack/react-query";
import { Nullish } from "@fireside/utils/src/types";
import { useUserQuery } from "./useUserQuery";

export const getCampQueryOptions = ({ userId }: { userId: Nullish<string> }) =>
  ({
    queryFn: async () => {
      const res = await client.protected.camp.retrieve.get();
      return res.data;
    },
    queryKey: ["camps", userId],
  } satisfies QueryOptions);

export const useCampsQuery = () => {
  const user = useUserQuery();

  return useQuery(getCampQueryOptions({ userId: user.data?.id }));
};
