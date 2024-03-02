import { ThemeToggle } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { Outlet, useLoaderData, useRouteContext } from "@tanstack/react-router";
import {
  ChevronLeft,
  CircleUserRound,
  PanelRight,
  PlusCircle,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ProfileDropdown } from "../ProfileDropdown";

export const RootCampLayout = () => {
  const [sideBarOpen, setSideBarOpen] = useState(true);
  const {} = useRouteContext({ from: "/camp" });
  return (
    <div className="h-screen w-screen flex">
      <div className="w-1/6 min-w-[200px] border-r-2 border-r-accent h-full p-2">
        <div className="h-[10%]">
          <div className="w-full flex justify-end">
            {!sideBarOpen && (
              <Button
                onClick={() => {
                  setSideBarOpen(true);
                }}
                variant={"ghost"}
              >
                <PanelRight />
              </Button>
            )}
          </div>
        </div>
        <div className="h-[80%] flex flex-col items-center justify-start w-full">
          <div className="h-1-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src="/joey-boy.jpg" />
              <AvatarFallback />
            </Avatar>
          </div>

          <div className="h-3/4 flex flex-col py-10 w-full">
            <Button
              className="flex gap-x-5 justify-between w-full"
              variant={"ghost"}
            >
              <div className="flex items-center ">
                <CircleUserRound />
                Friends
              </div>
              <div>3</div>
            </Button>
          </div>
        </div>
        <div className="h-[10%] min-h-[50px] flex items-end justify-evenly">
          <ThemeToggle />
          <Button variant={"ghost"}>
            <Settings />
          </Button>
          <ProfileDropdown />
        </div>
      </div>
      <div
        className={cn(["w-2/6 h-full flex flex-col", !sideBarOpen && "hidden"])}
      >
        <div className="h-[10%]  flex justify-end p-4">
          <Button
            onClick={() => {
              setSideBarOpen(false);
            }}
            variant={"ghost"}
          >
            <ChevronLeft />
          </Button>
        </div>
        <div className="h-[10%] flex items-start justify-start px-10">
          <span className="text-3xl font-semibold">Camp rooms</span>
        </div>
        <div className="h-4/5 flex flex-col justify-start items-center p-4">
          {/* <Button
            className="w-full text-lg py-6 flex gap-x-3"
            variant={"ghost"}
          >
            <span>Create class room</span>
            <PlusCircle />
          </Button> */}
        </div>
      </div>
      <div className="flex w-3/6 h-full">
        <Outlet />
      </div>
    </div>
  );
};
