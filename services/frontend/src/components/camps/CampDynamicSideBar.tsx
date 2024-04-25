import { cn } from "@/lib/utils";
import {
  Link,
  useMatchRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import {
  AudioLines,
  ChevronLeft,
  Image,
  MoreVertical,
  Pencil,
  PlusCircle,
} from "lucide-react";
import { useState } from "react";
import { Button, buttonVariants } from "../ui/button";
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
import { useAtom, useSetAtom } from "jotai";
import {
  createCampModalOpen,
  dynamicSideBarOpen,
  useUserCamps,
  useCreateCampMutation,
} from "./camps-state";
import { useScreenSize } from "@/hooks/useScreenSize";
import { CreateCampDialog } from "./CreateCampDialog";

export const CampDynamicSideBar = () => {
  const [sideBarOpen, setSideBarOpen] = useAtom(dynamicSideBarOpen);
  const [campSearch, setCampSearch] = useState("");
  const { camps } = useUserCamps();
  const match = useMatchRoute();
  const navigate = useNavigate();

  // useScreenSize({ // need to think of a better api, when should it fire
  //   width: {
  //     onMedium: () => {
  //       // console.log("on medium");
  //       setSideBarOpen(false);
  //     },

  //     onLarge: () => {
  //       if (!sideBarOpen) {
  //         // console.log("on large");
  //         setSideBarOpen(true);
  //       }
  //     },
  //   },
  // });

  // if (visualViewport?.width < 500) {
  //   return null
  // }

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
      <div className="flex flex-col w-full h-1/6 border-r-2 border-accent/50">
        <div className="h-1/2 flex items-start justify-start pt-5 pl-5 ">
          <span className="text-3xl font-semibold ">Camp Rooms</span>
        </div>
        <div className="flex h-1/2 border-b-2 gap-x-2 border-accent/50 px-5 py-2 justify-start w-full">
          <CreateCampDialog />
        </div>
      </div>
      <div className=" flex flex-col justify-start items-center h-5/6 border-r-2 border-accent/50">
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
                <Button
                  onClick={() => {
                    navigate({
                      to: "/camp/$campId",
                      params: {
                        campId: camp.id,
                      },
                    });
                  }}
                  variant={"ghost"}
                  className={cn([
                    "py-7 w-full flex justify-between",
                    match({
                      to: "/camp/$campId",
                      params: { campId: camp.id },
                    }) && "bg-accent",
                  ])}
                >
                  <div>
                    {/* <div className="rounded-full bg-green-200 border-green-100 border h-5 w-5"></div> */}
                    <Image />
                  </div>
                  <div className="flex flex-col">
                    <div>{camp.name}</div>
                    <div className="text-sm text-foreground/30">
                      {new Date(camp.createdAt).toDateString()}
                    </div>
                  </div>
                  <div className="relative w-1/4 flex items-center justify-end"></div>
                </Button>
                {/* <Button className="h-full p-0" variant={"ghost"}>
                  <AudioLines />
                </Button> */}
              </div>
            ))}
        </div>
      </div>
    </>
  );
};
