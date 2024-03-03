import { ThemeToggle } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Inbox, PanelRight, Search, Settings, User } from "lucide-react";
import { Button, buttonVariants } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ProfileDropdown } from "../ProfileDropdown";
import { useAtom } from "jotai";
import { dynamicSideBarOpen, useDefinedUser } from "./camps-state";
import { useCurrentRoute } from "@/hooks/useCurrentRoute";
import { useGetFriends, useGetUserFriendRequests } from "./friends-state";

export const CampStaticSideBar = () => {
  const [sideBarOpen, setSideBarOpen] = useAtom(dynamicSideBarOpen);
  const { friends } = useGetFriends();
  const currentRoute = useCurrentRoute();
  const { friendRequests, openFriendRequests } = useGetUserFriendRequests();
  const user = useDefinedUser();

  return (
    <>
      <div className="h-[10%]">
        <div className="w-full flex justify-between">
          <Link to="/camp">
            <img className="h-8 w-8" src="/logo.png" />
          </Link>

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
        <div className=""></div>
        <div className="h-1-4 flex items-start">
          <Avatar className="h-14 w-14">
            <AvatarImage src="/joey-boy.jpg" />
            <AvatarFallback />
          </Avatar>
        </div>

        <div className="h-3/4 flex flex-col py-10 w-full gap-y-1">
          <Link
            to="/camp/friends"
            className={buttonVariants({
              className: cn([
                "flex gap-x-4 justify-between w-full py-6 min-w-fit",
                currentRoute.routeId === "/camp-layout/camp/friends" &&
                  "bg-accent",
              ]),
              variant: "ghost",
            })}
          >
            <div className="flex items-center gap-x-4">
              <User />
              <span className="text-lg"> Friends</span>
            </div>
            <div className="text-lg  items-center">{friends.length}</div>
          </Link>

          <Link
            to="/camp/inbox"
            className={buttonVariants({
              className: cn([
                "flex gap-x-4 justify-between w-full py-6 min-w-fit",
                currentRoute.routeId === "/camp-layout/camp/inbox" &&
                  "bg-accent",
              ]),
              variant: "ghost",
            })}
          >
            <div className="flex items-center gap-x-4">
              <Inbox />
              <span className="text-lg"> Inbox</span>
            </div>
            <div className="text-lg items-center">
              {openFriendRequests.length}
            </div>
          </Link>
          <Link
            to="/camp"
            className={buttonVariants({
              className: cn([
                "flex gap-x-4 justify-between w-full py-6 min-w-fit",
                currentRoute.routeId === "/camp-layout/camp" && "bg-accent",
              ]),
              variant: "ghost",
            })}
          >
            <div className="flex items-center gap-x-4">
              <Search />
              <span className="text-lg"> Search camps</span>
            </div>
          </Link>
        </div>
      </div>
      <div className="h-[10%] min-h-[50px] flex items-end justify-evenly">
        <ThemeToggle />
        <Button variant={"ghost"}>
          <Settings />
        </Button>
        <ProfileDropdown />
      </div>
    </>
  );
};
