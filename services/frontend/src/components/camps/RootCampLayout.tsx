import { cn } from "@/lib/utils";
import { Outlet } from "@tanstack/react-router";

import { CampStaticSideBar } from "./CampStaticSideBar";
import { CampDynamicSideBar } from "./CampDynamicSideBar";
import { useAtomValue } from "jotai";
import { dynamicSideBarOpen } from "./camp-state";
import { Toaster } from "../ui/toaster";

export const RootCampLayout = () => {
  const sideBarOpen = useAtomValue(dynamicSideBarOpen);

  return (
    <div className="h-screen w-screen flex">
      <div className="w-[18%] border-r-2 border-r-accent/50 h-full p-2 px-4 min-w-fit">
        <CampStaticSideBar />
      </div>
      <div
        className={cn([
          "min-w-[28%] h-screen overflow-y-auto flex flex-col relative",
          !sideBarOpen && "hidden",
        ])}
      >
        <CampDynamicSideBar />
      </div>
      <div className="flex w-3/6 h-full">
        <Outlet />
      </div>
    </div>
  );
};
