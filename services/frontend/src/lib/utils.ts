import { InsideArray, InsidePromise, Nullish } from "@fireside/utils";
import { QueriesOptions, QueryClient } from "@tanstack/react-query";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { FiresideUser } from "./useUserQuery";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
