import { cn } from "@/lib/utils";
import { Outlet, useLoaderData, useRouter } from "@tanstack/react-router";

import { CampStaticSideBar } from "./CampStaticSideBar";
import { CampDynamicSideBar } from "./CampDynamicSideBar";
import { useAtomValue } from "jotai";
import { dynamicSideBarOpen } from "./camps-state";
import { Toaster } from "../ui/toaster";
import { useEffect } from "react";

export const RootCampLayout = () => {
  const sideBarOpen = useAtomValue(dynamicSideBarOpen);
  const router = useRouter();

  useEffect(() => {
    router.preloadRoute({
      to: "/camp/friends",
      params: {},
    });
    router.preloadRoute({
      to: "/camp/inbox",
      params: {},
    });
  }, []);

  return (
    <div className="h-screen w-screen flex p-8 relative">
      <div className="w-1 h-full absolute z-20 left-0" />

      <div className=" z-10 h-full transition-all duration-300 ease-in-out transform -translate-x-full hover:-translate-x-0 group-hover:-translate-x-0">
        <div className="w-[18%] border-r-accent/50 h-full p-2 px-4 min-w-fit">
          <CampStaticSideBar />
        </div>
      </div>

      <div className="flex flex-1 min-h-screen">
        <div
          className={cn([
            "min-w-[28%] h-screen overflow-y-auto flex flex-col relative",
            !sideBarOpen && "hidden",
          ])}
        >
          <CampDynamicSideBar />
        </div>
        <div
          className={cn(["flex h-screen", sideBarOpen ? "w-[54%]" : "w-[82%]"])}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
};
