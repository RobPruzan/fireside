import { cn } from "@/lib/utils";
import { Link, useLoaderData } from "@tanstack/react-router";
import { ChevronLeft, MoreVertical, PlusCircle } from "lucide-react";
import { useState } from "react";
import { Button, buttonVariants } from "../ui/button";
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
import { getCampQueryOptions } from "@/lib/useCampsQuery";
import { userQueryOptions } from "@/lib/useUserQuery";
import { hasKey } from "@fireside/utils";
import { useCurrentRoute } from "@/hooks/useCurrentRoute";
import { useSetAtom } from "jotai";
import { dynamicSideBarOpen } from "./camp-state";
export const CampDynamicSideBar = () => {
  const setSideBarOpen = useSetAtom(dynamicSideBarOpen);
  const [modalOpen, setModalOpen] = useState(false);
  const [campSearch, setCampSearch] = useState("");
  const [newCampRoomName, setNewCampRoomName] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const loaderData = useLoaderData({ from: "/camp-layout" });
  const user =
    useSuspenseQuery({ ...userQueryOptions, initialData: loaderData.user })
      .data ?? loaderData.user;

  const camps =
    useSuspenseQuery(getCampQueryOptions({ userId: user.id })).data ?? [];
  const currentRoute = useCurrentRoute();
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
    <>
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
          <Dialog open={modalOpen} onOpenChange={(open) => setModalOpen(open)}>
            <DialogTrigger asChild>
              <Button
                className="w-full text-lg flex gap-x-3 justify-center items-center"
                variant={"ghost"}
              >
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
                value={newCampRoomName}
                onChange={(e) => setNewCampRoomName(e.target.value)}
                className="camp-room-name"
              />
              <DialogFooter>
                <Button variant={"outline"}>Cancel</Button>
                <Button
                  className="min-w-[78px]"
                  onClick={() =>
                    createCampMutation.mutate({
                      name: newCampRoomName,
                    })
                  }
                >
                  {createCampMutation.isPending ? <LoadingSpinner /> : "Create"}
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
                      currentRoute.routeId === "/camp-layout/camp/$campId" &&
                        hasKey(currentRoute.params, "campId") &&
                        currentRoute.params.campId === camp.id &&
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
                  <div className="relative w-1/4 flex items-center justify-end"></div>
                </Link>
                <Button className="h-full p-0" variant={"ghost"}>
                  <MoreVertical />
                </Button>
              </div>
            ))}
        </div>
      </div>
    </>
  );
};
