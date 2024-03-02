import { useParams } from "@tanstack/react-router";

export const Camp = () => {
  const { campId } = useParams({ from: "/camp-layout/camp/$campId" });
  return <div>hello from {campId}</div>;
};
