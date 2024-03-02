import { useParams, useRouter, useRouterState } from "@tanstack/react-router";

export const Camp = () => {
  const { campId } = useParams({ from: "/camp/$campId" });
  return <div>hello from {campId}</div>;
};
