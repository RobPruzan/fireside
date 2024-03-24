import { Link, useParams } from "@tanstack/react-router";
import {
  useCreateThreadMessageMutation,
  useGetThreadMessages,
  useGetThreads,
} from "./thread-state";
import { XIcon } from "lucide-react";
import { Button, buttonVariants } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useGetMessages } from "./message-state";
import { useState } from "react";

export const Thread = () => {
  const { threadId, campId } = useParams({
    from: "/root-auth/camp-layout/camp/$campId/$threadId",
  });

  const { messages } = useGetMessages({ campId });

  const { threads } = useGetThreads({ campId });

  const thread = threads.find((thread) => thread.id === threadId);

  const parentMessage = messages.find(
    ({ id }) => id === thread?.parentMessageId
  )!;

  const createThreadMessageMutation = useCreateThreadMessageMutation({
    threadId,
  });
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const { threadMessages } = useGetThreadMessages({ threadId });
  // const {} = useGetThre
  return (
    <div className="h-full  flex flex-col  px-2">
      <div className=" break-words border-b-2 p-2">{parentMessage.message}</div>
      <Link
        to="/camp/$campId"
        params={{
          campId,
        }}
        className={buttonVariants({
          className: "absolute top-1 right-1",
          variant: "ghost",
        })}
      >
        <XIcon />
      </Link>

      <div className="p-2 flex flex-col h-[calc(100%-85px)]">
        {threadMessages.map((thread) => (
          <div className="border rounded-md">{thread.message}</div>
        ))}
      </div>
      <Textarea
        onChange={(e) => setCurrentMessage(e.target.value)}
        value={currentMessage ?? ""}
        onKeyDown={(e) => {
          if (!currentMessage) {
            return;
          }
          if (e.key === "Enter" && !e.shiftKey) {
            createThreadMessageMutation.mutate({
              id: crypto.randomUUID(),
              message: currentMessage,
              createdAt: new Date().toISOString(),
            });

            setCurrentMessage("");
          }
        }}
        className="h-[50px]"
      />
    </div>
  );
};
