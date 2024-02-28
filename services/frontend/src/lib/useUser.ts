import { client } from "@/main";
import { QueryOptions, useQuery } from "@tanstack/react-query";
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
    if (res.error) {
      return Promise.reject(res.error);
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

  retryDelay: 10000,
} satisfies QueryOptions;

export const useUser = () => useQuery(userQueryOptions);
