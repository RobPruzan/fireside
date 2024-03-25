import {
  Link,
  Outlet,
  useMatch,
  useMatchRoute,
  useParams,
} from "@tanstack/react-router";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useRef, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
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
  Edit,
  Image,
  MessageCircle,
  MessageCircleIcon,
  SmilePlus,
  Trash,
} from "lucide-react";
import { Button, buttonVariants } from "../ui/button";
import { Avatar } from "../ui/avatar";
import { run } from "@fireside/utils";
import { CampMessage } from "@fireside/db";
import {
  useGetMessages,
  useCreateMessageMutation,
  useGetMessageReactions,
  useGetReactionAssets,
  useReactToMessageMutation,
  useRemoveReactionMutation,
} from "./message-state";
import { useDefinedUser } from "./camps-state";
import { Setter } from "@/types/utils";
import { FiresideUser } from "@/lib/useUserQuery";
import { ThreadIcon } from "../ui/icons/thread";
import { Thread } from "./Thread";
import { useGetThreads } from "./thread-state";
import { toast } from "../ui/use-toast";
import { Textarea } from "../ui/textarea";
export const Camp = () => {
  const [userMessage, setUserMessage] = useState("");
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
      // #TODO don't auto scroll if the user has scrolled up in view port
      lastChild.scrollIntoView({
        behavior: "instant",
        block: "end",
        inline: "nearest",
      });
    }
  }, [messages.length]);

  const createMessageMutation = useCreateMessageMutation({ campId });
  // const user = useDefinedUser();
  const match = useMatchRoute();
  const [messageWithContextMenuId, setMessageWithContextMenuId] = useState<
    null | string
  >(null);

  const mainMessageSection = (
    <div className="p-1  flex flex-col h-full  w-full px-2">
      <div className="flex w-full h-[calc(100%-85px)] ">
        <div
          ref={scrollRef}
          className="flex flex-col w-full h-full overflow-y-auto gap-y-3"
        >
          {messages
            .sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            )
            .map((messageObj, index) => (
              <Message
                key={messageObj.id}
                messageObj={messageObj}
                messageWithContextMenuId={messageWithContextMenuId}
                setMessageWithContextMenuId={setMessageWithContextMenuId}
                order={
                  index === 0
                    ? "first"
                    : index === messages.length - 1
                    ? "last"
                    : "middle"
                }
              />
            ))}
        </div>
      </div>

      <Textarea
        placeholder="Send a question..."
        onKeyDown={(e) => {
          if (!userMessage && e.key === "Enter" && !e.shiftKey) {
            setUserMessage("");
            e.preventDefault();
            return;
          }

          if (e.key === "Enter" && !e.shiftKey) {
            createMessageMutation.mutate({
              message: userMessage,
              createdAt: new Date().toISOString(),
              id: crypto.randomUUID(),
            });
            setUserMessage("");
            e.preventDefault();
          }
        }}
        value={userMessage}
        onChange={(event) => setUserMessage(event.target.value)}
        className="flex h-[50px]"
      />
    </div>
  );

  return (
    <div className="flex  w-full h-full px-5 pb-5">
      {match({
        to: "/camp/$campId/$threadId",
      }) ? (
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel minSize={30} className="h-full w-full">
            {mainMessageSection}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel minSize={25} className="p-1  h-full">
            <Outlet />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        mainMessageSection
      )}
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

const Message = ({
  messageObj,
  order = "middle",
  setMessageWithContextMenuId,
  messageWithContextMenuId,
}: {
  messageObj: CampMessage & { user: NonNullable<FiresideUser> };
  order?: "first" | "last" | "middle";
  setMessageWithContextMenuId: Setter<string | null>;
  messageWithContextMenuId: string | null;
}) => {
  const { campId } = useParams({ from: "/root-auth/camp-layout/camp/$campId" });
  const { messageReactions } = useGetMessageReactions({ campId });
  const { reactionAssets } = useGetReactionAssets();
  const user = useDefinedUser();
  const reactMutation = useReactToMessageMutation({
    campId,
  });
  const removeReactionMutation = useRemoveReactionMutation({
    campId,
  });

  const { threads } = useGetThreads({ campId });

  const thread = threads.find(
    (thread) => thread.parentMessageId === messageObj.id
  );

  return (
    <div
      className={cn([
        "w-full flex ",
        order === "last" && "pb-4",
        order === "first" && "pt-4",
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
              <div className="flex items-start space-x-2 w-full">
                <Avatar className="w-10 h-10 grid place-content-center border">
                  <Image size={20} />
                </Avatar>
                <div className="text-sm font-medium leading-none">
                  <h3 className="text-base">{messageObj.user.email}</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex gap-x-1">
                      <span>
                        {new Date(messageObj.createdAt).toLocaleDateString()}
                      </span>
                      <span>
                        {new Date(messageObj.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    {/* {run(() => {
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
                      ThreadIcon;
                      return "a while ago";
                    })} */}
                  </span>
                  <div className="flex gap-x-1">
                    <div className="flex items-center justify-center p-1 h-fit">
                      {thread?.id ? (
                        <Link
                          to="/camp/$campId/$threadId"
                          params={{
                            threadId: thread?.id,
                            campId: campId,
                          }}
                          // style={{
                          //   padding: "4px !important",
                          // }}
                          className={buttonVariants({
                            variant: "ghost",

                            className:
                              " text-foreground h-fit  py-0 pl-0 px-0 pb-0 pt-0 pr-0 ",
                          })}
                        >
                          <MessageCircleIcon size={20} />
                        </Link>
                      ) : (
                        <Button
                          onClick={() => {
                            toast({
                              title: "Thread not available yet",
                              description: "Try again in a few seconds",
                            });
                          }}
                          variant={"ghost"}
                          className=" text-foreground h-fit py-0 pl-0 px-0 pb-0 pt-0 pr-0  "
                        >
                          <MessageCircleIcon size={20} />
                        </Button>
                      )}
                    </div>

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
                        <ReactionMenuContent messageId={messageObj.id} />
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="flex flex-wrap gap-x-2">
                      {run(() => {
                        const reactions = messageReactions.filter(
                          (reaction) => reaction.messageId === messageObj.id
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
                                  messageId === messageObj.id
                              )
                              .find(({ userId }) => userId === user.id);
                            return (
                              <div key={asset.id} className="flex items-center">
                                <Button
                                  onClick={() => {
                                    if (existingReaction) {
                                      removeReactionMutation.mutate({
                                        reactionId: existingReaction.id,
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
                                    "h-9 w-9 p-1 ",
                                    existingReaction && "bg-muted/50",
                                  ])}
                                  variant={"ghost"}
                                >
                                  <img src={asset.imgSrc} alt={asset.alt} />
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
            <div className="max-w-none break-words ">{messageObj.message}</div>
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
};
