import { client } from "@/main";
import {
  useSuspenseQuery,
  QueryOptions,
  useQuery,
} from "@tanstack/react-query";
import { User } from "../../../db/src";

export type FiresideUser = Omit<User, "token" | "password"> | null;
export const userQueryOptions = {
  queryKey: ["user"],
  queryFn: async () => {
    const res = await client.user["is-logged-in"].post({
      $fetch: {
        credentials: "include",
      },
    });
    console.log({ res });
    if (res.error) {
      return Promise.reject(res.error);
    }

    switch (res.data.kind) {
      case "logged-in": {
        return res.data.user;
      }
      case "not-logged-in": {
        return null;
      }
    }
  },
  retryDelay: 10000,
} satisfies QueryOptions;

export const useUser = () => {
  const userQuery = useQuery(userQueryOptions);
  return userQuery;
};
