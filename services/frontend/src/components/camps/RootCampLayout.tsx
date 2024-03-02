import { ThemeToggle } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import {
  Link,
  Outlet,
  useChildMatches,
  useLoaderData,
  useMatch,
  useMatchRoute,
  useRouteContext,
  useRouterState,
} from "@tanstack/react-router";
import {
  ChevronLeft,
  CircleUserRound,
  MessageSquare,
  MoreHorizontal,
  MoreVertical,
  PanelRight,
  PlusCircle,
  Search,
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
  const [campSearch, setCampSearch] = useState("");
  const loaderData = useLoaderData({ from: "/camp" });
  const user =
    useSuspenseQuery({ ...userQueryOptions, initialData: loaderData.user })
      .data ?? loaderData.user;
  const match = useMatchRoute();

  const campIdRoute = match({ to: "/camp/$campId" });
  const matchesExplore = match({ to: "/camp/" });
  const matchesFriends = match({ to: "/camp/friends" });

  // const childrenMatches = use

  const camps =
    useSuspenseQuery(getCampQueryOptions({ userId: user.id })).data ?? [];
  console.log({ camps });
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
            <Link
              to="/camp/friends"
              className={buttonVariants({
                className: cn([
                  "flex gap-x-4 justify-between w-full py-6 min-w-fit",
                  matchesFriends && "bg-accent",
                ]),
                variant: "ghost",
              })}
              // className="flex gap-x-5 justify-between w-full py-6"
              // variant={"ghost"}
            >
              <div className="flex items-center gap-x-4">
                <User />
                <span className="text-lg"> Friends</span>
              </div>
              <div className="text-lg  items-center">3</div>
            </Link>

            <Link
              to="/camp/"
              className={buttonVariants({
                className: cn([
                  "flex gap-x-4 justify-between w-full py-6 min-w-fit",
                  matchesExplore && "bg-accent",
                ]),
                variant: "ghost",
              })}
            >
              <div className="flex items-center gap-x-4">
                <Search />
                <span className="text-lg"> Search</span>
              </div>
              <div className="text-lg items-center">0</div>
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
      </div>
      <div
        className={cn([
          "min-w-[28%] h-screen overflow-y-auto flex flex-col relative",
          !sideBarOpen && "hidden",
        ])}
      >
        <Button
          className="absolute top-2 right-2"
          onClick={() => {
            setSideBarOpen(false);
          }}
          variant={"ghost"}
        >
          <ChevronLeft />
        </Button>

        <div className="flex flex-col w-full h-1/6">
          <div className="h-1/2 flex items-start justify-start pt-5 pl-5 ">
            <span className="text-3xl font-semibold ">Camp rooms</span>
          </div>
          <div className="flex h-1/2 border-b-2 gap-x-2 border-accent/50 px-5 py-2 justify-start w-full">
            <Dialog
              open={modalOpen}
              onOpenChange={(open) => setModalOpen(open)}
            >
              <DialogTrigger asChild>
                <Button
                  className="w-full text-lg flex gap-x-3 justify-center items-center"
                  variant={"ghost"}
                >
                  {/* <span>Create camp room</span> */}
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
                    {createCampMutation.isPending ? (
                      <LoadingSpinner />
                    ) : (
                      "Create"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className=" flex flex-col justify-start items-center h-5/6">
          <div className="w-full flex justify-star p-5">
            <Input
              value={campSearch}
              onChange={(e) => setCampSearch(e.target.value)}
              placeholder="Search my camps"
              className="w-full min-[50px]"
            />
          </div>

          <div className="flex flex-col overflow-y-auto h-full w-full p-5 gap-y-1">
            {camps
              .filter((camp) =>
                camp.name.toLowerCase().includes(campSearch.toLowerCase())
              )
              .toSorted(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((camp) => (
                <div className="flex w-full items-center gap-x-2" key={camp.id}>
                  <Link
                    // onClick={() => nav}
                    to="/camp/$campId"
                    params={{
                      campId: camp.id,
                    }}
                    className={buttonVariants({
                      className: cn([
                        "py-9 w-full flex justify-between",
                        campIdRoute &&
                          campIdRoute.campId === camp.id &&
                          "bg-accent",
                      ]),
                      variant: "ghost",
                    })}
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
                    <div className="relative w-1/4 flex items-center justify-end">
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
                  <Button className="h-full p-0" variant={"ghost"}>
                    <MoreVertical />
                  </Button>
                </div>
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
