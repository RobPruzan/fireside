import { Link, useParams } from "@tanstack/react-router";
import { useGetThreads } from "./thread-state";
import { XIcon } from "lucide-react";
import { Button, buttonVariants } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

export const Thread = () => {
  const { threadId, campId } = useParams({
    from: "/root-auth/camp-layout/camp/$campId/$threadId",
  });

  const { threads } = useGetThreads({ campId });

  const thread = threads.find((thread) => thread.id === threadId);
  return (
    <div className="h-full  flex flex-col relative px-2">
      <div className="p-2 flex flex-col h-[calc(100%-85px)]">
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
      <Textarea className="h-[50px]" />
    </div>
  );
};
