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
