import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Outlet } from "@tanstack/react-router";
import { NavBar } from "../camps/NavBar";

export const RootLandingLayout = () => {
  return (
    <div className="min-h-calc flex flex-col items-start w-screen justify-start">
      <NavBar />
      <Outlet />

      <ReactQueryDevtools buttonPosition="bottom-left" />
    </div>
  );
};
