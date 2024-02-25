export type test = "hello";


export const run = <T>(fn: () => T) => fn()