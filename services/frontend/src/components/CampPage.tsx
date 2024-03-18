import React from "react";
import { Button } from "./ui/button";
import { School } from "lucide-react";
import { createRootRouteWithContext, useParams } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { QueryClient } from "@tanstack/react-query";

type Props = {};

export const CampPage = () => {
  const { campId } = useParams({ from: "/camp-page/$campId" });
  return (
    <div className="h-full  flex flex-col p-2 gap-y-3">
      <Button>Joe</Button>
    </div>
  );
};
