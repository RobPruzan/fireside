import { treaty } from "@elysiajs/eden";

import { App } from "@fireside/backend";
import { Nullish } from "@fireside/utils";

export const client = treaty<App>(import.meta.env.VITE_API_URL, {
  fetch: {
    credentials: "include",
  },
});

type SimpleResponse<T> = {
  error: { status: unknown; value: unknown } | null;
  data: Nullish<T>;
};
export const dataOrThrow = <T>(response: SimpleResponse<T>) => {
  if (response.error?.value) {
    throw new Error(JSON.stringify(response.error.value));
  }

  return response.data as T;
};

export const promiseDataOrThrow = async <T>(
  response: Promise<SimpleResponse<T>>,
) => {
  const awaitedPromise = await response;
  if (awaitedPromise.error?.value) {
    throw new Error(JSON.stringify(awaitedPromise.error.value));
  }

  return awaitedPromise.data as T;
};
