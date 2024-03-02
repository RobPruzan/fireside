import { useLoaderData } from "@tanstack/react-router";

export const Explore = () => {
  const { user } = useLoaderData({ from: "/camp/" });

  return <div className="w-full flex justify-center items-center">explore</div>;
};
