import { ThemeToggle } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { Link, useMatchRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronRight,
  Inbox,
  PanelRight,
  Search,
  Settings,
  Tent,
  User,
} from "lucide-react";
import { Button, buttonVariants } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ProfileDropdown } from "../ProfileDropdown";
import { useAtom } from "jotai";
import { dynamicSideBarOpen, useDefinedUser } from "./camps-state";
import { useGetFriends, useGetUserFriendRequests } from "./friends-state";

export const CampStaticSideBar = () => {
  const [sideBarOpen, setSideBarOpen] = useAtom(dynamicSideBarOpen);
  const { friends } = useGetFriends();

  const match = useMatchRoute();
  const { openFriendRequests } = useGetUserFriendRequests();
  const user = useDefinedUser();
  return (
    <div className="flex flex-col items-start justify-start h-full py-4">
      <div className="flex flex-col items-center justify-start  w-full h-[15%] gap-y-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src="/joey-boy.jpg" />
          <AvatarFallback />
        </Avatar>

        {!sideBarOpen && (
          <Button
            variant={"ghost"}
            onClick={() => setSideBarOpen(true)}
            className=" "
          >
            <PanelRight />
          </Button>
        )}
      </div>
      <div className="flex flex-col items-center justify-start  w-full h-[75%] relative">
        <Link
          to="/camp/friends"
          className={buttonVariants({
            className: cn([
              "flex gap-x-4 justify-between w-full py-6 min-w-fit",
              match({ to: "/camp/friends" }) && "bg-accent",
            ]),
            variant: "ghost",
          })}
        >
          <div className="flex items-center gap-x-4">
            <User />
          </div>
        </Link>

        <Link
          to="/camp/inbox"
          className={buttonVariants({
            className: cn([
              "flex gap-x-4 justify-between w-full py-6 min-w-fit",
              match({ to: "/camp/inbox" }) && "bg-accent",
            ]),
            variant: "ghost",
          })}
        >
          <div className="flex items-center gap-x-4">
            <Inbox />
          </div>
        </Link>
        <Link
          to="/camp"
          className={buttonVariants({
            className: cn([
              "flex gap-x-4 justify-between w-full py-6 min-w-fit",
              match({ to: "/camp" }) && "bg-accent",
            ]),
            variant: "ghost",
          })}
        >
          <div className="flex items-center gap-x-4">
            <Tent />
          </div>
        </Link>
      </div>

      <div className="h-[10%] min-h-[50px] flex flex-col items-end justify-evenly">
        <ThemeToggle />
        <ProfileDropdown />
      </div>
    </div>
  );
};
