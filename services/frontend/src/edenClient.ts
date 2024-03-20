import { treaty } from "@elysiajs/eden";

import { App } from "@fireside/backend";
import { Nullish } from "@fireside/utils";
import { z } from "zod";
// @ts-expect-error  types are being wonky for some reason
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
  // i don't like this error handling but whatever

  if (response.error?.value) {
    const isStringRes = z.string().safeParse(response.error.value);

    if (isStringRes.success) {
      const hasMessageRes = z
        .object({ message: z.string() })
        .safeParse(JSON.parse(isStringRes.data));

      if (hasMessageRes.success) {
        throw new Error(hasMessageRes.data.message);
      }

      throw new Error(isStringRes.data);
    }
    console.error(JSON.stringify(response.error));
    throw new Error("Unknown error");
  }

  return response.data as T;
};

export const promiseDataOrThrow = async <T>(
  response: Promise<SimpleResponse<T>>
) => {
  const awaitedPromise = await response;
  if (awaitedPromise.error?.value) {
    throw new Error(JSON.stringify(awaitedPromise.error.value));
  }

  return awaitedPromise.data as T;
};
