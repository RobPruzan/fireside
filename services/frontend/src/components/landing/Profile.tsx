import { useLoaderData } from "@tanstack/react-router";

export const Profile = () => {
  const { user } = useLoaderData({ from: "/profile" });

  return (
    <div className="flex flex-col min-h-calc w-screen items-center justify-start p-10">
      {user.displayName}
      <br />
      {user.email}
    </div>
  );
};
