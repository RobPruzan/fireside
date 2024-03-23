import { useParams } from "@tanstack/react-router";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Reaction } from "@fireside/db";
import {
  useGetMessages,
  useCreateMessageMutation,
  useGetMessageReactions,
  useGetReactionAssets,
  useReactToMessageMutation,
  useRemoveReactionMutation,
} from "./message-state";
import { useDefinedUser } from "./camps-state";
export const Camp = () => {
  const [userMessage, setUserMessage] = useState<string>("");
  const { campId } = useParams({ from: "/root-auth/camp-layout/camp/$campId" });
  const reactMutation = useReactToMessageMutation({
    campId,
  });
  const removeReactionMutation = useRemoveReactionMutation({
    campId,
  });
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
  const user = useDefinedUser();
  const [messageWithContextMenuId, setMessageWithContextMenuId] = useState<
    null | string
  >(null);

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
          .map((messageObj, index) => {
            return (
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
                        messageWithContextMenuId === messageObj.id &&
                          "bg-muted",
                      ])}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 w-full">
                          <Avatar className="w-10 h-10 grid place-content-center border">
                            <Image size={20} />
                          </Avatar>
                          <div className="text-sm font-medium leading-none">
                            <h3 className="text-base">
                              {messageObj.user.email}
                            </h3>
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
                            <div className="flex">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    className="h-7 w-7 p-1 -ml-1 mr-4"
                                    variant={"ghost"}
                                  >
                                    <SmilePlus />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-48 flex flex-wrap gap-2 items-center">
                                  <ReactionMenuContent
                                    messageId={messageObj.id}
                                  />
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <div className="flex flex-wrap gap-x-2">
                                {run(() => {
                                  const reactions = messageReactions.filter(
                                    (reaction) =>
                                      reaction.messageId === messageObj.id
                                  );

                                  const count: Record<string, number> = {};

                                  reactions.forEach((reaction) =>
                                    count[reaction.reactionAssetId]
                                      ? (count[reaction.reactionAssetId] =
                                          count[reaction.reactionAssetId] + 1)
                                      : (count[reaction.reactionAssetId] = 1)
                                  );

                                  return Object.entries(count).map(
                                    ([reactionAssetId, count]) => {
                                      const asset = reactionAssets.find(
                                        ({ id }) => id === reactionAssetId
                                      )!;

                                      const existingReaction = reactions
                                        .filter(
                                          ({ reactionAssetId, messageId }) =>
                                            reactionAssetId === asset.id &&
                                            messageObj.id === messageId
                                        )
                                        .find(
                                          ({ userId }) => userId === user.id
                                        );
                                      return (
                                        <div className="flex items-center">
                                          <Button
                                            onClick={() => {
                                              if (existingReaction) {
                                                removeReactionMutation.mutate({
                                                  reactionId:
                                                    existingReaction.id,
                                                });
                                                return;
                                              }

                                              reactMutation.mutate({
                                                messageId: messageObj.id,
                                                reactionAssetId: asset.id,
                                                id: crypto.randomUUID(),
                                              });
                                            }}
                                            className={cn([
                                              "h-7 w-7 p-1 ",
                                              existingReaction && "bg-muted",
                                            ])}
                                            variant={"ghost"}
                                          >
                                            <img
                                              src={asset.imgSrc}
                                              alt={asset.alt}
                                            />
                                          </Button>
                                          {count}
                                        </div>
                                      );
                                    }
                                  );
                                })}
                              </div>
                            </div>
                          </div>
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
                      <ContextMenuSubContent className="w-48 flex flex-wrap gap-2 items-center">
                        <ReactionMenuContent messageId={messageObj.id} />
                      </ContextMenuSubContent>
                    </ContextMenuSub>
                    <ContextMenuItem className="flex gap-x-2 text-destructive">
                      <Trash size={17} /> Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              </div>
            );
          })}
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
              id: crypto.randomUUID(),
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

const ReactionMenuContent = ({ messageId }: { messageId: string }) => {
  const { campId } = useParams({ from: "/root-auth/camp-layout/camp/$campId" });
  const reactMutation = useReactToMessageMutation({
    campId,
  });
  const { messageReactions } = useGetMessageReactions({ campId });
  const { reactionAssets } = useGetReactionAssets();
  const user = useDefinedUser();
  const reactions = messageReactions.filter(
    (reaction) => reaction.messageId === messageId
  );

  return reactionAssets.map((asset) => {
    const existingReaction = reactions
      .filter(
        ({ reactionAssetId, messageId: iterMessageId }) =>
          reactionAssetId === asset.id && iterMessageId === messageId
      )
      .find(({ userId }) => userId === user.id);

    return (
      <Button
        disabled={!!existingReaction}
        key={asset.id}
        onClick={() => {
          reactMutation.mutate({
            messageId,
            reactionAssetId: asset.id,
            id: crypto.randomUUID(),
          });
        }}
        variant={"ghost"}
        className="h-7 w-7 p-0"
      >
        <img src={asset.imgSrc} alt={asset.alt} />
      </Button>
    );
  });
};
