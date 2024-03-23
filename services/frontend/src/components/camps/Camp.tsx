import { useParams } from "@tanstack/react-router";
import { Input } from "../ui/input";
import { useEffect, useRef, useState } from "react";
import { useCreateMessageMutation, useGetMessages } from "./camps-state";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  Edit,
  Flame,
  Frown,
  Skull,
  Smile,
  SmilePlus,
  Trash,
} from "lucide-react";
import { Button } from "../ui/button";
export const Camp = () => {
  const [userMessage, setUserMessage] = useState<string>("");
  const { campId } = useParams({ from: "/root-auth/camp-layout/camp/$campId" });

  const { messages } = useGetMessages({ campId });
  const scrollRef = useRef<HTMLInputElement | null>(null);

  const [likesCounts, setLikesCounts] = useState<{
    [messageId: string]: number;
  }>({});

  useEffect(() => {
    const lastChild = scrollRef.current?.lastChild;

    if (lastChild instanceof HTMLElement) {
      lastChild.scrollIntoView({
        behavior: "instant",
        block: "end",
        inline: "nearest",
      });
    }
  }, [messages]);

  const createMessageMutation = useCreateMessageMutation({ campId });

  const [messageWithContextMenuId, setMessageWithContextMenuId] = useState<
    null | string
  >(null);

  console.log("yay", { messageWithContextMenuId });
  return (
    <div className="flex flex-col w-full h-full p-5 gap-y-4">
      <div
        ref={scrollRef}
        className="flex flex-col w-full h-[calc(100%-50px)] overflow-auto gap-y-6"
      >
        {messages
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
          .map((messageObj) => (
            <div className="flex items-center gap-x-2">
              {messageObj.user.email}
              <ContextMenu
                onOpenChange={(v) => {
                  if (v) {
                    setMessageWithContextMenuId(messageObj.id);
                    return;
                  }

                  setMessageWithContextMenuId(null);
                }}
              >
                <ContextMenuTrigger asChild>
                  <div
                    className={cn([
                      "w-full flex hover:bg-muted",
                      messageWithContextMenuId === messageObj.id && "bg-muted",
                    ])}
                  >
                    <div className="p-4 border-l-2 w-3/4" key={messageObj.id}>
                      {messageObj.message}
                    </div>
                    <div className="w-1/4 flex justify-end items-center">
                      <span className="text-sm">
                        {new Date(messageObj.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem className="flex gap-x-2">
                    <Edit size={17} /> Edit
                  </ContextMenuItem>

                  <ContextMenuSub>
                    <ContextMenuSubTrigger className="flex gap-x-2">
                      <SmilePlus size={17} /> Reactions
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-48 flex flex-wrap  justify-evenly items-center">
                      {/* <div className="w-full">
                        <Input />
                      </div> */}

                      <Button
                        className="flex items-center w-fit h-fit justify-center"
                        variant={"ghost"}
                      >
                        <Smile size={17} />
                      </Button>
                      <Button
                        className="flex items-center w-fit h-fit justify-center"
                        variant={"ghost"}
                      >
                        <Frown size={17} />
                      </Button>
                      <Button
                        className="flex items-center w-fit h-fit justify-center"
                        variant={"ghost"}
                      >
                        <ArrowUp size={17} />
                      </Button>
                      <Button
                        className="flex items-center w-fit h-fit justify-center"
                        variant={"ghost"}
                      >
                        <ArrowDown size={17} />
                      </Button>
                      <Button
                        className="flex items-center w-fit h-fit justify-center"
                        variant={"ghost"}
                      >
                        <Skull size={17} />
                      </Button>
                      <Button
                        className="flex items-center w-fit h-fit justify-center"
                        variant={"ghost"}
                      >
                        <Flame size={17} />
                      </Button>
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                  <ContextMenuItem className="flex gap-x-2 text-destructive">
                    <Trash size={17} /> Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </div>
          ))}
      </div>

      <Input
        onKeyDown={(e) => {
          if (userMessage === "") {
            return;
          }
          if (e.key === "Enter") {
            createMessageMutation.mutate({
              message: userMessage,
              createdAt: new Date().toISOString(),
            });
            setUserMessage("");
          }
        }}
        value={userMessage}
        onChange={(event) => setUserMessage(event.target.value)}
        className="flex h-[50px]"
      />
    </div>
  );
};
