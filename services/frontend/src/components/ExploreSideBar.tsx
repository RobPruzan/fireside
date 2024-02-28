import React from "react";
import { Button } from "./ui/button";
import { School } from "lucide-react";
import { useParams } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type Props = {};

export const ExploreSidebar = () => {
  const { campId } = useParams({ from: "/explore/$campId" });
  return (
    <div className="h-full  flex flex-col p-2 gap-y-3">
      {/* <Button
        disabled={campId === "cse-312"}
        className={cn([
          "flex gap-x-4",
          campId === "cse-312" && "bg-accent text-white",
        ])}
        variant={"ghost"}
      >
        <School /> CSE 312
      </Button>
      <Button
        // disabled={campId === "cse-312"}
        className={cn([
          "flex gap-x-4",
          // campId === "cse-312" && "bg-accent text-white",
        ])}
        variant={"ghost"}
      >
        <School /> CSE 312
      </Button>
      <Button
        // disabled={campId === "cse-312"}
        className={cn([
          "flex gap-x-4",
          // campId === "cse-312" && "bg-accent text-white",
        ])}
        variant={"ghost"}
      >
        <School /> CSE 312
      </Button>
      <Button
        // disabled={campId === "cse-312"}
        className={cn([
          "flex gap-x-4",
          // campId === "cse-312" && "bg-accent text-white",
        ])}
        variant={"ghost"}
      >
        <School /> CSE 312
      </Button>
      <Button
        // disabled={campId === "cse-312"}
        className={cn([
          "flex gap-x-4",
          // campId === "cse-312" && "bg-accent text-white",
        ])}
        variant={"ghost"}
      >
        <School /> CSE 312
      </Button>
      <Button
        // disabled={campId === "cse-312"}
        className={cn([
          "flex gap-x-4",
          // campId === "cse-312" && "bg-accent text-white",
        ])}
        variant={"ghost"}
      >
        <School /> CSE 312
      </Button> */}
    </div>
  );
};
