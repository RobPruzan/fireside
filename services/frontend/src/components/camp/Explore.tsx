import { useLoaderData } from "@tanstack/react-router";

export const Explore = () => {
  const res2 = useLoaderData({ from: "/camp/" });

  return <div className="w-full"></div>;
};
