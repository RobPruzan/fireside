import { useUser } from "@/lib/user";
import { useRouteContext } from "@tanstack/react-router";

export const Profile = () => {
  const { user } = useRouteContext({ from: "/profile" });

  return (
    <div className="flex flex-col">
      <div>Email: {user.email}</div>
      <div>Display name: {user.displayName}</div>
      <div>Display name: {user.role}</div>
    </div>
  );
};
