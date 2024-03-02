import { useMatches } from "@tanstack/react-router";

export const useCurrentRoute = () => {
  const matches = useMatches();
  const currentRoute = matches.at(-1)!;
  return currentRoute;
};
