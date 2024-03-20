import { useParams } from "@tanstack/react-router";
import { Input } from "../ui/input";
import { Button, buttonVariants } from "../ui/button";
import { useEffect, useRef, useState } from "react";
import { CampMessage } from "@fireside/db";
import { useMutation } from "@tanstack/react-query";
import { toast } from "../ui/use-toast";
import { client, promiseDataOrThrow } from "@/edenClient";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { makeOptimisticUpdater } from "@/lib/utils";
import { useCreateMessageMutation, useGetMessages } from "./camps-state";

export const Camp = () => {
  const [userMessage, setUserMessage] = useState<string>("");
  const { campId } = useParams({ from: "/root-auth/camp-layout/camp/$campId" });

  const { messages } = useGetMessages({ campId });
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
  }, [messages]);

  const createMessageMutation = useCreateMessageMutation({ campId });
  return (
    <div className="flex flex-col w-full h-full p-5">
      <div
        ref={scrollRef}
        className="flex flex-col w-full h-[calc(100%-50px)] overflow-auto "
      >
        {messages
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
          .map((messageObj) => (
            <div className="p-4" key={messageObj.id}>
              {messageObj.message} {new Date(messageObj.createdAt).getTime()}
            </div>
          ))}
      </div>

      <Input
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            createMessageMutation.mutate({
              message: userMessage,
              createdAt: new Date().toISOString(),
            });
            setUserMessage("");
          }
        }}
        placeholder="What's on your mind?"
        value={userMessage}
        onChange={(event) => setUserMessage(event.target.value)}
        className="flex h-[50px]"
      />
    </div>
  );
};
