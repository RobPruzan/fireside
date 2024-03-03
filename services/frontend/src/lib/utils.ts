import { Nullish } from "@fireside/utils";
import { QueryClient } from "@tanstack/react-query";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { FiresideUser } from "./useUserQuery";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const makeArrayOptimisticUpdater =
  <T>({
    queryClient,
    queryKey,
  }: {
    queryClient: QueryClient;
    queryKey: Array<Nullish<string>>;
  }) =>
  (stateOrUpdater: T | ((prev: Array<T>) => Array<T>)) => {
    if (typeof stateOrUpdater === "function") {
      queryClient.setQueryData(queryKey, stateOrUpdater);
      return;
    }

    queryClient.setQueryData(queryKey, () => stateOrUpdater);
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
