import { Nullish } from "@fireside/utils";
import { QueryClient } from "@tanstack/react-query";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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
