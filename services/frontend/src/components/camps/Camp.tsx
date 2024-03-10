import { useParams } from "@tanstack/react-router";

export const Camp = () => {
  const { campId } = useParams({ from: "/root-auth/camp-layout/camp/$campId" });
  return <div>hello from {campId}</div>;
};
