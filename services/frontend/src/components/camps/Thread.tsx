import { nanoid } from "nanoid";
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
import { useEffect, useRef, useState } from "react";
import { useDefinedUser } from "./camps-state";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";
import { LoadingSection } from "../ui/loading";

export const Thread = ({ threadId }: { threadId: string }) => {
  const { campId } = useParams({
    from: "/root-auth/camp-layout/camp/$campId",
  });

  const { messages } = useGetMessages({ campId });

  const { threads } = useGetThreads({ campId });

  const thread = threads.find((thread) => thread.id === threadId);

  const parentMessage = messages.find(
    ({ id }) => id === thread?.parentMessageId
  )!;
  const user = useDefinedUser();

  const createThreadMessageMutation = useCreateThreadMessageMutation({
    threadId,
  });
  const [currentMessage, setCurrentMessage] = useState("");
  const { threadMessages } = useGetThreadMessages({ threadId });

  const scrollRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const lastChild = scrollRef.current?.lastChild!;
    if (lastChild instanceof HTMLElement) {
      lastChild.scrollIntoView({
        behavior: "instant",
        block: "end",
        inline: "nearest",
      });
    }
  }, [threadMessages.length]);

  if (!parentMessage) {
    return (
      <div className="w-full h-full flex justify-center items-center text-xl font-bold">
        No thread to be found!
      </div>
    );
  }

  return (
    <div className="h-full  flex flex-col  relative px-2">
      <div className=" break-words border-b-2 p-2">{parentMessage.message}</div>
      <Link
        from="/camp/$campId"
        preload={false}
        search={(prev) => ({ ...prev, threadId: undefined })}
        className={buttonVariants({
          className: "absolute top-1 right-1",
          variant: "ghost",
        })}
      >
        <XIcon />
      </Link>

      <div
        ref={scrollRef}
        className="p-2 flex flex-col h-[calc(100%-85px)] gap-y-2 w-full overflow-y-scroll"
      >
        {[...threadMessages]
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )

          .map((threadMessage, index) => (
            <div
              className={cn([
                " w-fit p-2 flex items-start flex-col max-w-[75%]",
                threadMessage.userId === user.id ? "ml-auto " : "mr-auto ",
                index === threadMessages.length - 1 && "pb-4",
                index === 0 && "pt-4",
              ])}
            >
              {threadMessage.user.username}
              <pre
                className={cn([
                  "border rounded-md  p-2 font-sans w-full text-wrap text-sm",
                  threadMessage.userId === user.id && "bg-primary",
                ])}
              >
                {threadMessage.message}
              </pre>
            </div>
          ))}
      </div>
      <Textarea
        onChange={(e) => setCurrentMessage(e.target.value)}
        value={currentMessage}
        onKeyDown={(e) => {
          if (!currentMessage && e.key === "Enter" && !e.shiftKey) {
            setCurrentMessage("");
            e.preventDefault();
            return;
          }

          if (e.key === "Enter" && !e.shiftKey) {
            createThreadMessageMutation.mutate({
              id: nanoid(),
              message: currentMessage ?? "",
              createdAt: new Date().toISOString(),
            });

            setCurrentMessage("");
            e.preventDefault();
          }
        }}
        className="h-[50px] mb-1 border-2 border-accent/50"
      />
    </div>
  );
};
