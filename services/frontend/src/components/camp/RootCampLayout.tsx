import { Outlet } from "@tanstack/react-router";

export const RootCampLayout = () => {
  return (
    <div className="h-screen w-screen">
      hello
      <Outlet />
    </div>
  );
};
