import { InsideArray, InsidePromise, Nullish } from "@fireside/utils";
import { QueriesOptions, QueryClient } from "@tanstack/react-query";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { FiresideUser } from "./useUserQuery";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const makeArrayOptimisticUpdater =
  <
    TQueryFNResult,
    TQueryFnResult = InsideArray<InsidePromise<TQueryFNResult>>
  >({
    queryClient,
    options,
  }: {
    queryClient: QueryClient;
    options: {
      queryFn: () => TQueryFNResult;
      queryKey: Array<Nullish<string>>;
    };
  }) =>
  (
    stateOrUpdater:
      | TQueryFnResult
      | ((prev: Array<TQueryFnResult>) => Array<TQueryFnResult>)
  ) => {
    if (typeof stateOrUpdater === "function") {
      queryClient.setQueryData(options.queryKey, stateOrUpdater);
      return;
    }

    queryClient.setQueryData(options.queryKey, () => stateOrUpdater);
  };

export const getNotMeUser = ({
  users,
  mainUserId,
}: {
  users: { userOne: FiresideUser; userTwo: FiresideUser };
  mainUserId: string;
}) => {
  if (users.userOne?.id === mainUserId) {
    return users.userTwo;
  }
  if (users.userTwo?.id === mainUserId) {
    return users.userOne;
  }

  return null;
};

export const getNotMeUserId = ({
  users,
  mainUserId,
}: {
  users: { userOneId: string; userTwoId: string };
  mainUserId: string;
}) => {
  if (users.userOneId === mainUserId) {
    return users.userTwoId;
  }
  if (users.userTwoId === mainUserId) {
    return users.userOneId;
  }

  return null;
};
