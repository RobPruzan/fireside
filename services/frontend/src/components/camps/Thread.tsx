import { Link, useParams } from "@tanstack/react-router";
import { useGetThreads } from "./thread-state";
import { XIcon } from "lucide-react";
import { Button, buttonVariants } from "../ui/button";
import { Input } from "../ui/input";

export const Thread = () => {
  const { threadId, campId } = useParams({
    from: "/root-auth/camp-layout/camp/$campId/$threadId",
  });

  const { threads } = useGetThreads({ campId });

  const thread = threads.find((thread) => thread.id === threadId);
  return (
    <div className="h-full flex flex-col relative">
      <div className="p-2 flex flex-col h-[calc(100%-50px)]">
        <Link
          to="/camp/$campId"
          params={{
            campId,
          }}
          className={buttonVariants({
            className: "absolute top-2 right-2",
            variant: "ghost",
          })}
        >
          <XIcon />
        </Link>
      </div>
      <Input className="h-[50px]" />
    </div>
  );
};
