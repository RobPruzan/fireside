import { InsideArray, InsidePromise, Nullish, hasKey } from "@fireside/utils";
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

export const retryConnect = <
  T extends { readyState: number } | { ws: { readyState: number } }
>(
  callback: () => T,
  setSubscription: (ws: T) => void,
  retriesLeft = 7,
  duration = 500
) => {
  console.log(`RETRYING (retries left: ${retriesLeft})`);
  if (retriesLeft === 0) {
    return;
  }
  setTimeout(async () => {
    const subscription = callback();

    await new Promise((res) => {
      setTimeout(() => {
        res(null);
      }, 1500);
    });

    if ("readyState" in subscription) {
      if (subscription.readyState === WebSocket.OPEN) {
        console.log("Reconnected WS connection!");
        setSubscription(subscription);
        return;
      }
    } else {
      if (subscription.ws.readyState === WebSocket.OPEN) {
        console.log("Reconnected WS connection!");
        setSubscription(subscription);
        return;
      }
    }

    retryConnect(callback, setSubscription, retriesLeft - 1, duration * 1.5);
  }, duration);
};
