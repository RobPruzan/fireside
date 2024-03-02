import { ThemeToggle } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import {
  Link,
  Outlet,
  useLoaderData,
  useRouteContext,
} from "@tanstack/react-router";
import {
  ChevronLeft,
  CircleUserRound,
  MessageSquare,
  PanelRight,
  PlusCircle,
  Settings,
  User,
} from "lucide-react";
import { useState } from "react";
import { Button, buttonVariants } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ProfileDropdown } from "../ProfileDropdown";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { client } from "@/edenClient";
import { useToast } from "../ui/use-toast";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

import { LoadingSpinner } from "../ui/loading";
import { FiresideCamp } from "../../../../db/src";
import { getCampQueryOptions, useCampsQuery } from "@/lib/useCampsQuery";
import { useUserQuery, userQueryOptions } from "@/lib/useUserQuery";

export const RootCampLayout = () => {
  const [sideBarOpen, setSideBarOpen] = useState(true);
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);

  const [campRoomName, setCampRoomName] = useState("");
  const queryClient = useQueryClient();

  const { user } = useLoaderData({ from: "/camp" });

  const camps =
    useSuspenseQuery(getCampQueryOptions({ userId: user.id })).data ?? [];

  const createCampMutation = useMutation({
    mutationKey: ["create-camp"],
    mutationFn: async (createOps: { name: string }) => {
      const res = await client.protected.camp.create.post(createOps);
      if (res.error) {
        throw Error(res.error.value);
      }

      return res.data;
    },
    onSuccess: (camp) => {
      queryClient.setQueryData<Array<FiresideCamp>>(
        getCampQueryOptions({ userId: user.id }).queryKey,
        (prev) => [...(prev ?? []), camp]
      );
      setModalOpen(false);
    },
    onError: () =>
      toast({ title: "Failed to create camp", variant: "destructive" }),
  });

  return (
    <div className="h-screen w-screen flex">
      <div className="w-[18%] border-r-2 border-r-accent/50 h-full p-2 px-4 min-w-fit">
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
            <Button
              className="flex gap-x-5 justify-between w-full py-6"
              variant={"ghost"}
            >
              <div className="flex items-center gap-x-4">
                <User />
                <span className="text-lg"> Friends</span>
              </div>
              <div className="text-lg  items-center">3</div>
            </Button>
            <Button
              className={cn([
                "flex gap-x-4 justify-between w-full py-6 min-w-fit",
                true && "bg-accent",
              ])}
              variant={"ghost"}
            >
              <div className="flex items-center gap-x-4">
                <MessageSquare />
                <span className="text-lg"> Camp rooms</span>
              </div>
              <div className="text-lg items-center">0</div>
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
        className={cn([
          "min-w-[28%] h-screen overflow-y-auto flex flex-col",
          !sideBarOpen && "hidden",
        ])}
      >
        <div className="h-[5%]  flex justify-end p-4">
          <Button
            className="absolute"
            onClick={() => {
              setSideBarOpen(false);
            }}
            variant={"ghost"}
          >
            <ChevronLeft />
          </Button>
        </div>
        <div className="h-[5%] flex items-start justify-start px-10">
          <span className="text-3xl font-semibold ">Camp rooms</span>
        </div>
        <div className=" flex flex-col justify-start items-center p-4">
          <Dialog open={modalOpen} onOpenChange={(open) => setModalOpen(open)}>
            <DialogTrigger asChild>
              <Button
                className="w-full text-lg py-6 flex gap-x-3 justify-start"
                variant={"ghost"}
              >
                <span>Create class room</span>
                <PlusCircle />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create camp room</DialogTitle>
                <DialogDescription></DialogDescription>
              </DialogHeader>
              <Label htmlFor="camp-room-name">Name</Label>
              <Input
                value={campRoomName}
                onChange={(e) => setCampRoomName(e.target.value)}
                className="camp-room-name"
              />
              <DialogFooter>
                <Button variant={"outline"}>Cancel</Button>
                <Button
                  className="min-w-[78px]"
                  onClick={() =>
                    createCampMutation.mutate({
                      name: campRoomName,
                    })
                  }
                >
                  {createCampMutation.isPending ? <LoadingSpinner /> : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <div className="flex flex-col overflow-y-auto h-full w-full">
            {camps
              .toSorted(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((camp) => (
                <Link
                  // onClick={() => nav}
                  to="/camp/$campId"
                  params={{
                    campId: camp.id,
                  }}
                  key={camp.id}
                  className={buttonVariants({
                    className: "py-9 w-full flex justify-between",
                    variant: "ghost",
                  })}
                  // variant={"ghost"}
                >
                  <div>
                    <div className="rounded-full bg-green-200 border-green-100 border h-5 w-5"></div>
                  </div>
                  <div className="flex flex-col">
                    <div>{camp.name}</div>
                    <div className="text-sm text-foreground/30">
                      {new Date(camp.createdAt).toDateString()}
                    </div>
                  </div>
                  <div className="relative w-1/4 flex items-start">
                    {/* <Avatar className="absolute top-0 right-0">
                    <AvatarImage className="w-5 h-5" src="/person.png" />
                  </Avatar>
                  <Avatar className="absolute top-- right-2">
                    <AvatarImage className="w-5 h-5" src="/person.png" />
                  </Avatar>
                  <Avatar className="absolute top-0 right-4">
                    <AvatarImage className="w-5 h-5" src="/person.png" />
                  </Avatar> */}
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
      <div className="flex w-3/6 h-full">
        <Outlet />
      </div>
    </div>
  );
};
