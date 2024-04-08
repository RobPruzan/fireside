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
    <div className="h-[100dvh] w-screen flex ">
      <div className="w-[5%] border-r-2 border-r-accent/50 h-full p-2 px-4 min-w-fit">
        <CampStaticSideBar />
      </div>
      <div
        className={cn([
          "min-w-[25%] h-[100dvh] overflow-y-auto flex flex-col relative",
          !sideBarOpen && "hidden",
          "hidden lg:flex",
        ])}
      >
        {/* {visualViewport} */}
        <CampDynamicSideBar />
      </div>
      <div
        className={cn(["flex h-[100dvh] w-[70%]", sideBarOpen && "w-[95%]"])}
      >
        <Outlet />
      </div>
    </div>
  );
};
