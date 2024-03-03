export type Nullish<T> = T | null | undefined;

type IsDate<T extends Date> = T;

export type DateToString<
  T,
  StringOrOriginal = T extends IsDate<infer _> ? string : T,
  CanBeNull = null extends T ? true : false,
  WithoutDateUnion = CanBeNull extends true ? StringOrOriginal | null : T,
  IsOnlyDate = T extends IsDate<infer _> ? true : false,
  WithoutAloneDate = IsOnlyDate extends true ? string : WithoutDateUnion
> = WithoutAloneDate;

export type DatesToString<T extends Record<string, unknown>> = {
  [K in keyof T]: DateToString<T[K]>;
};

type intersectUnion<t> = (t extends unknown ? (_: t) => void : never) extends (
  _: infer intersection
) => void
  ? intersection
  : never;

export type unionKeyOf<t> = keyof intersectUnion<t>;

export const hasKey = <o extends object, k extends unionKeyOf<o>>(
  o: o,
  k: k
): o is Extract<o, { [_ in k]: unknown }> => k in o;

export type InsidePromise<T> = T extends Promise<infer R>
  ? R
  : "Better luck next time";
export type InsideArray<T> = T extends Array<infer R>
  ? R
  : "Wow u suck at this";
