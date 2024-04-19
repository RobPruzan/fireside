import {
  QueryOptions,
  UseQueryOptions,
  queryOptions,
  useQuery,
} from "@tanstack/react-query";
import { User } from "../../../db/src";
import { client } from "@/edenClient";

export type FiresideUser = Omit<User, "token" | "password"> | null;
export const userQueryOptions = queryOptions({
  queryKey: ["user"],
  queryFn: async () => {
    const res = await client.api.user["is-logged-in"].post();

    if (res.error) {
      throw res.error;
    }
    res.data.user;

    switch (res.data.kind) {
      case "logged-in": {
        return res.data.user;
      }
      case "not-logged-in": {
        return null;
      }
    }
  },
  refetchInterval: 10000,
  retryDelay: 10000,
});

export const useUserQuery = () => useQuery(userQueryOptions);
