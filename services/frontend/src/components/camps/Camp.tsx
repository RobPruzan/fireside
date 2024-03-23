import { useParams } from "@tanstack/react-router";
import { Input } from "../ui/input";
import { useEffect, useRef, useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  ChevronDownIcon,
  ChevronUpIcon,
  Edit,
  Flame,
  Frown,
  Image,
  MessageCircle,
  Skull,
  Smile,
  SmilePlus,
  Trash,
} from "lucide-react";
import { Button } from "../ui/button";
import { Avatar } from "../ui/avatar";
import { run } from "@fireside/utils";
import {
  useGetMessages,
  useCreateMessageMutation,
  useGetMessageReactions,
  useGetReactionAssets,
} from "./message-state";
export const Camp = () => {
  const [userMessage, setUserMessage] = useState<string>("");
  const { campId } = useParams({ from: "/root-auth/camp-layout/camp/$campId" });

  const { messages } = useGetMessages({ campId });

  const { messageReactions } = useGetMessageReactions({ campId });
  const { reactionAssets } = useGetReactionAssets();
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

  const [messageWithContextMenuId, setMessageWithContextMenuId] = useState<
    null | string
  >(null);
  console.log({ reactionAssets });
  return (
    <div className="flex flex-col w-full h-full px-5 pb-5">
      <div
        ref={scrollRef}
        className="flex flex-col w-full h-[calc(100%-50px)] overflow-y-auto gap-y-3"
      >
        {messages
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
          .map((messageObj, index) => (
            <div
              key={messageObj.id}
              className={cn([
                "w-full flex ",
                index === messages.length - 1 && "pb-4",
                index === 0 && "pt-4",
              ])}
            >
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
                      "space-y-4 border w-full p-3 rounded-md",
                      messageWithContextMenuId === messageObj.id && "bg-muted",
                    ])}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 w-[calc(100%-150px)]">
                        <Avatar className="w-10 h-10 grid place-content-center border">
                          <Image size={20} />
                        </Avatar>
                        <div className="text-sm font-medium leading-none">
                          <h3 className="text-base">{messageObj.user.email}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Asked{" "}
                            {run(() => {
                              const secondsAway =
                                (new Date().getTime() -
                                  new Date(messageObj.createdAt).getTime()) /
                                (1000 * 60);

                              if (secondsAway < 60) {
                                return "less than a minute ago";
                              }

                              if (secondsAway < 60 * 60) {
                                `${secondsAway / 60}m ago`;
                              }

                              if (secondsAway < 60 * 60 * 24) {
                                `${secondsAway / (60 * 60)}hr ago`;
                              }

                              if (secondsAway < 60 * 60 * 24 * 7) {
                                `${secondsAway / (60 * 60 * 24)}d ago`;
                              }

                              return "a while ago";
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="w-[150px] flex flex-col h-full">
                        <div className="flex w-full  gap-x-2 justify-center">
                          <Button>
                            <ChevronUpIcon className="w-4 h-4" />
                          </Button>
                          <Button>
                            <ChevronDownIcon className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="w-full">{/* <MessageCircle /> */}</div>
                      </div>
                    </div>
                    <div className="prose dark:prose-dark max-w-none">
                      <p>{messageObj.message}</p>
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
                    <ContextMenuSubContent className="w-48 flex flex-wrap gap-2  justify-evenly items-center">
                      {reactionAssets.map((asset) => (
                        <Button variant={"ghost"} className="h-8 w-8 p-0">
                          <img src={asset.imgSrc} alt={asset.alt} />
                        </Button>
                      ))}
                      {/* <Button
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
                      </Button> */}
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
              parentMessageId: null,
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
