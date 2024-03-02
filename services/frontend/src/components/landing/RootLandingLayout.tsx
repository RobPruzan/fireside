import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Outlet } from "@tanstack/react-router";
import { Toaster } from "../ui/toaster";
import { NavBar } from "../camp/NavBar";

export const RootLandingLayout = () => {
  return (
    <div className="min-h-calc flex flex-col items-start w-screen justify-start">
      <NavBar />
      <Outlet />
      <Toaster />

      <ReactQueryDevtools buttonPosition="bottom-left" />
    </div>
  );
};
