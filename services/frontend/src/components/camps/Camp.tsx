import { nanoid } from "nanoid";
import {
  Link,
  Outlet,
  useMatch,
  useMatchRoute,
  useNavigate,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MutableRefObject,
  Suspense,
  createContext,
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
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
import { cn, retryConnect } from "@/lib/utils";
import {
  ArrowLeft,
  AudioLines,
  BookCheck,
  Captions,
  ChevronLeft,
  ChevronRight,
  Edit,
  Image,
  Info,
  Lock,
  Megaphone,
  MessageCircle,
  MessageCircleIcon,
  Move,
  Pencil,
  Presentation,
  SmilePlus,
  Trash,
  Unlock,
  XIcon,
  Users,
} from "lucide-react";
import { Button, buttonVariants } from "../ui/button";
import { Avatar } from "../ui/avatar";
import { Nullish, hasKey, run } from "@fireside/utils";
import { CampMessage } from "@fireside/db";
import {
  useGetMessages,
  // useCreateMessageMutation,
  useGetMessageReactions,
  useGetReactionAssets,
  useReactToMessageMutation,
  useRemoveReactionMutation,
  useGetCamp,
} from "./message-state";
import {
  useCreateTranscriptionGroup,
  useDefinedUser,
  useGetTranscriptionGroup,
} from "./camps-state";
import { Setter } from "@/types/utils";
import { FiresideUser } from "@/lib/useUserQuery";
import { ThreadIcon } from "../ui/icons/thread";
import { Thread } from "./Thread";
import { useGetThreads } from "./thread-state";
import { toast, useToast } from "../ui/use-toast";
import { Textarea } from "../ui/textarea";
import { client, dataOrThrow } from "@/edenClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PublishedMessage } from "@fireside/backend/src/message-endpoints";
import { threadId } from "worker_threads";
import { WhiteBoardLoader } from "./whiteboard/WhiteBoard";
import {
  getWhiteBoardImagesOptions,
  useCreateWhiteBoardMessageMutation,
  useCreateWhiteBoardMutation,
  useGetWhiteBoardMessages,
} from "./whiteboard/white-board-state";
import { LoadingSection, LoadingSpinner } from "../ui/loading";
import { useWebRTCConnection } from "@/hooks/useAudioStream";
import { TranscriberContext } from "@/lib/transcription/hooks/useTranscriber";
import { Transcribe } from "./Transcribe";
import { Progress } from "@/lib/transcription/components/Progress";

// import { useAudioStream } from "@/hooks/useAudioStream";
const subscribeFn = client.api.protected.message.ws({
  campId: "anything",
}).subscribe;


type Subscription = null | ReturnType<typeof subscribeFn>;
const SocketMessageContext = createContext<{
  subscription: Subscription | null;
}>({
  subscription: null,
});

export const Camp = () => {
  const { campId } = useParams({ from: "/root-auth/camp-layout/camp/$campId" });
  const subscribeUserFn = client.api.protected.user.connectedusers({campId}).subscribe();
  const { messages } = useGetMessages({ campId });
  const { camp } = useGetCamp({ campId });
  const scrollRef = useRef<HTMLInputElement | null>(null);
  const user = useDefinedUser();
  const [listeningToAudio, setListeningToAudio] = useState(false);
  const [broadcastingAudio, setBroadcastingAudio] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  // const { transcriber } = useContext(TranscriberContext);
  const {
    createWebRTCOffer,
    listenForAudio,
    listenToBroadcaster,
    stopListeningForAudio,
    stopListeningToBroadcast,
    broadcastingToUsers,
    isBroadcasting,
  } = useWebRTCConnection({
    campId,
    options: {
      listeningToAudio,
      broadcastingAudio,
      // onRecordingComplete: (blob) => {
      //   transcriber.onInputChange();
      // },
    },
  });

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
  const subscriptionRef = useRef<null | ReturnType<typeof subscribeUserFn>>(null);
  useEffect(() => {
    const newSubscription = client.api.protected.user.connectedusers({campId}).subscribe();

    const handleMessage = (event: { data: { type: string; payload: any; }; }) => {
      const data = event.data as { type: string; payload: any };
  
      if (data.type === "connected-users") {
        setActiveUsers(data.payload);
      }
    };
 
    subscriptionRef.current = newSubscription;
  
    return () => {
      newSubscription.close();
    };
  }, [campId]);
  
  const [activeUsers, setActiveUsers] = useState<string[] | undefined | null>([]);
  useEffect(() => {
    client.api.protected.user.connectedusers({campId}).get()
      .then(res => {
        if(res.data){
          const activeUsers = res.data[campId].sort() ;
          setActiveUsers(activeUsers);
        }
      })
      .catch(error => {
        console.error('Error fetching active users:', error);
      });
  }, [campId]);
  console.log("Res",activeUsers);
  const toggleUsers = () => {
    setShowUsers((prev) => !prev);
  };
  const createWhiteBoardMutation = useCreateWhiteBoardMutation();
  const search = useSearch({ from: "/root-auth/camp-layout/camp/$campId" });
  const createTranscriptionGroupMutation = useCreateTranscriptionGroup();
  const { transcriptionGroupQuery, transcriptionGroup } =
    useGetTranscriptionGroup({ campId });
  const { toast } = useToast();
  const navigate = useNavigate({ from: "/root-auth/camp-layout/camp/$campId" });
  const searchEntries = Object.entries(search);
  const [toolbarOpen, setToolBarOpen] = useState(false);
  const { transcriber } = useContext(TranscriberContext);
  // console.log({ transcriptionGroupQuery });
  return (
    <div className="flex  w-full h-full  pb-5 relative">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel className="h-full w-full relative">
          <div className="w-full flex flex-col justify-center items-center absolute top-0">
            <div
              className={cn([
                "flex  border border-t-0 rounded-b-md justify-center gap-x-4 items-center  pl-10  backdrop-blur bg-background  z-10 text-muted-foreground animate-size-change",
                camp.createdBy === user.id && broadcastingToUsers.length !== 0
                  ? "h-32"
                  : "h-20",
              ])}
            >
              <div className="text-xl font-bold">{camp.name}</div>

              {toolbarOpen &&
                (camp.createdBy === user.id ? (
                  <div className="flex flex-col w-full">
                    <div className="flex gap-x-4 items-center justify-center">
                      <Button
                        onClick={() => {
                          if (!transcriptionGroup) {
                            toast({
                              variant: "destructive",
                              description: "No transcription to view",
                            });
                            return;
                          }
                          navigate({
                            to: "/camp/$campId",
                            search: (prev) => ({
                              ...("campId" in prev && prev.campId === campId
                                ? prev
                                : {}),
                              transcriptionGroupId: transcriptionGroup?.id,
                            }),
                          });
                        }}
                        variant={"ghost"}
                      >
                        <Captions />
                      </Button>
                      <Button
                        onClick={async () => {
                          createWhiteBoardMutation.mutate({
                            whiteBoardId: campId,
                          });

                          navigate({
                            to: "/camp/$campId",
                            search: (prev) => ({
                              ...("campId" in prev && prev.campId === campId
                                ? prev
                                : {}),
                              whiteBoardId: campId,
                            }),
                          });
                        }}
                        variant={"ghost"}
                      >
                        <Presentation />
                      </Button>

                      <Button
                        onClick={async () => {
                          // console.log("TRANSCRIBE AT CLICK", {
                          //   transcriber,
                          // });

                          if (!broadcastingAudio) {
                            await listenForAudio();
                            toast({
                              title: "Broadcasting audio",
                              description:
                                // duration: Infinity,
                                "Your audio will be transcribed live and broadcasted for all users in the camp",
                            });
                          } else {
                            stopListeningForAudio();
                          }

                          await createTranscriptionGroupMutation.mutateAsync({
                            campId,
                          });

                          transcriptionGroupQuery.refetch();

                          setBroadcastingAudio((prev) => {
                            return !prev;
                          });
                        }}
                        variant={"ghost"}
                      >
                        {createTranscriptionGroupMutation.isPending ? (
                          <LoadingSpinner />
                        ) : (
                          <Megaphone
                            className={cn([
                              broadcastingAudio && "text-green-500",
                            ])}
                          />
                        )}
                      </Button>
                      <Button variant="ghost" onClick={toggleUsers}>
                       <Users />
                      </Button>
                      {/* <Button variant={"ghost"}>
                        <BookCheck />
                      </Button> */}
                    </div>
                    {broadcastingToUsers.length > 0 && (
                      <div className="flex overflow-x-auto items-center p-3">
                        {broadcastingToUsers.map((userId) => (
                          <div
                            key={userId}
                            className="border  p-3 text-xs rounded-full"
                          >
                            {userId.slice(1, 5)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-x-4">
                    <Button
                      onClick={() => {
                        if (!transcriptionGroup) {
                          toast({
                            variant: "destructive",
                            description: "No transcription to view",
                          });
                          return;
                        }
                        navigate({
                          to: "/camp/$campId",
                          search: (prev) => ({
                            ...("campId" in prev && prev.campId === campId
                              ? prev
                              : {}),
                            transcriptionGroupId: transcriptionGroup?.id,
                          }),
                        });
                      }}
                      variant={"ghost"}
                    >
                      <Captions />
                    </Button>
                    <Button
                      onClick={() => {
                        createWhiteBoardMutation.mutate({
                          whiteBoardId: campId,
                        });

                        navigate({
                          to: "/camp/$campId",
                          search: (prev) => ({
                            ...prev,
                            whiteBoardId: campId,
                          }),
                        });
                      }}
                      variant={"ghost"}
                    >
                      <Presentation />
                    </Button>

                    <Button
                      onClick={() => {
                        if (!listeningToAudio) {
                          listenToBroadcaster();
                        } else {
                          stopListeningToBroadcast();
                        }
                        setListeningToAudio((prev) => {
                          return !prev;
                        });
                      }}
                      className="relative"
                      variant={"ghost"}
                    >
                      {isBroadcasting && (
                        <Info className="text-green-500 absolute -top-3 -right-3" />
                      )}
                      <AudioLines
                        className={cn([listeningToAudio && "text-green-500"])}
                      />
                    </Button>
                    <Button variant="ghost" onClick={toggleUsers}>
                      <Users />
                    </Button>
                  </div>
                ))}

              <Button
                onClick={() => setToolBarOpen((prev) => !prev)}
                variant={"ghost"}
              >
                {toolbarOpen ? <ChevronLeft /> : <ChevronRight />}
              </Button>

              {/* <div>

              </div> */}

                

            </div>
            {showUsers && activeUsers && (
                <div className="absolute top-0 right-0 mr-4 mt-2">
                  <div className="flex flex-col">
                    <h4 className="font-bold text-xs">Active Users</h4>
                    <div className="flex items-center gap-2 overflow-auto">
                      {activeUsers.map((userId, index) => (
                        <span key={index} className="rounded-full px-3 py-1 text-sm">
                          {userId}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            
            {transcriber.progressItems.length > 0 && (
              <>
                <div className=" p-4 w-full flex rounded-t-none border-t-0 flex-col border rounded-md bg-background z-40 bg-yellow-600">
                  <label>Loading model files... (only run once)</label>
                  {transcriber.progressItems.map((data) => (
                    <div key={data.file}>
                      <Progress text={data.file} percentage={data.progress} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <MessageSection campId={campId} />
        </ResizablePanel>
        <ResizableHandle
          className="bg-accent/50 w-[2px]"
          withHandle={searchEntries.length > 0}
        />

        {searchEntries.length > 0 && (
          <ResizablePanel className="p-1  h-full flex flex-col">
            <ResizablePanelGroup direction="vertical">
              {searchEntries.map(([k, v], index) => {
                const typedKey = k as keyof typeof search;

                switch (typedKey) {
                  case "threadId": {
                    return v ? (
                      <>
                        <ResizablePanel
                          key={k}
                          id={k}
                          style={{
                            height: `${100 / searchEntries.length}%`,
                          }}
                          minSize={30}
                          className={cn([" w-full"])}
                        >
                          <Suspense fallback={<LoadingSection />}>
                            <Thread threadId={v} />
                          </Suspense>
                        </ResizablePanel>

                        {index !== searchEntries.length - 1 && (
                          <ResizableHandle
                            className="bg-accent/50"
                            withHandle={searchEntries.length > 0}
                          />
                        )}
                      </>
                    ) : null;
                  }

                  case "whiteBoardId": {
                    return v ? (
                      <>
                        <ResizablePanel
                          key={k}
                          style={{
                            height: `${100 / Object.entries(search).length}%`,
                          }}
                          minSize={30}
                          className={cn([" w-full"])}
                        >
                          <WhiteBoardLoader
                            whiteBoardId={v}
                            options={{
                              readOnly: camp.createdBy !== user.id,
                              slot: (
                                <Link
                                  from="/camp/$campId"
                                  preload={false}
                                  search={(prev) => ({
                                    ...prev,
                                    whiteBoardId: undefined,
                                  })}
                                  className={buttonVariants({
                                    className: "absolute top-1 right-1 ",
                                    variant: "ghost",
                                  })}
                                >
                                  <XIcon className="text-black" />
                                </Link>
                              ),
                            }}
                          />
                        </ResizablePanel>

                        {index !== searchEntries.length - 1 && (
                          <ResizableHandle
                            className="bg-accent/50 "
                            withHandle={searchEntries.length > 0}
                          />
                        )}
                      </>
                    ) : null;
                  }

                  case "transcriptionGroupId": {
                    return (
                      <>
                        <ResizablePanel>
                          <div className="h-full border-l w-full text-xs overflow-y-auto">
                            <Transcribe
                              slot={
                                <Button
                                  className="absolute top-3 right-3"
                                  onClick={() => {
                                    navigate({
                                      to: "/camp/$campId",
                                      search: (prev) => {
                                        const search: any = { ...prev };

                                        delete search["transcriptionGroupId"];

                                        return search;
                                      },
                                    });
                                  }}
                                >
                                  <XIcon />
                                </Button>
                              }
                              campId={campId}
                            />
                          </div>
                        </ResizablePanel>

                        {index !== searchEntries.length - 1 && (
                          <ResizableHandle
                            className="bg-accent/50 "
                            withHandle={searchEntries.length > 0}
                          />
                        )}
                      </>
                    );
                  }
                }
              })}
            </ResizablePanelGroup>
          </ResizablePanel>
        )}
      </ResizablePanelGroup>
    </div>
  );
};
const MessageSection = memo(({ campId }: { campId: string }) => {
  const [userMessage, setUserMessage] = useState("");

  const { messages } = useGetMessages({ campId });
  const scrollRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const { messagesQueryKey } = useGetMessages({ campId });
  const { threadsQueryKey } = useGetThreads({ campId });
  const { whiteBoardMessages, whiteBoardMessagesQuery } =
    useGetWhiteBoardMessages({ campId });
  const createWhiteBoardMessageMutation = useCreateWhiteBoardMessageMutation({
    campId,
  });
  const createWhiteBoardMutation = useCreateWhiteBoardMutation();
  const [whiteBoardDialogOpen, setWhiteBoardDialogOpen] = useState(false);
  const user = useDefinedUser();
  const [nonCreatedMessageWhiteBoardInfo, setNonCreatedMessageWhiteBoardInfo] =
    useState<null | { whiteBoardId: string; attach: boolean }>(null);

  useEffect(() => {
    const lastChild = scrollRef.current?.lastChild!;
    if (lastChild instanceof HTMLElement) {
      // #TODO don't auto scroll if the user has scrolled up in view port
      lastChild.scrollIntoView({
        behavior: "instant",
        block: "end",
      });
    }
  }, [messages.length, whiteBoardMessages.length]);

  const updateMessageCache = (publishedMessage: PublishedMessage) => {
    queryClient.setQueryData(messagesQueryKey, (prev) => [
      ...(prev ?? []),
      {
        message: publishedMessage.message.message,
        user: publishedMessage.user,
        campId: publishedMessage.message.campId,
        createdAt: publishedMessage.message.createdAt,
        id: publishedMessage.message.id,
        userId: publishedMessage.user.id,
        // userId: user.id,
        // ...message,
      },
    ]);

    queryClient.setQueryData(threadsQueryKey, (prev) => [
      ...(prev ?? []),
      {
        userId: publishedMessage.user.id,
        campId: publishedMessage.message.campId,
        createdBy: publishedMessage.thread.createdBy!,
        ...publishedMessage.thread,
      },
    ]);
  };

  const [subscription, setSubscription] = useState<null | ReturnType<
    typeof subscribeFn
  >>(null);

  useEffect(() => {
    if (!subscription) {
      return;
    }
    const handleMessage = async (event: { data: string }) => {
      updateMessageCache(JSON.parse(event.data) as PublishedMessage);

      await new Promise((res) => {
        setTimeout(() => {
          res(null), 1000; // the white board creation is not part of the message, give some time for it to create. This is a race but not a big deal if it fails (we still have a refetch interval)
        });
      });
      whiteBoardMessagesQuery.refetch();
    };
    subscription.ws.addEventListener("message", handleMessage);

    return () => {
      if (!subscription) {
        return;
      }
      subscription.ws.removeEventListener("message", handleMessage);
    };
  }, [subscription]);

  useEffect(() => {
    const newSubscription = client.api.protected.message
      .ws({ campId })
      .subscribe();
    
    const handleClose = () => {
      retryConnect(() => {
        const res = client.api.protected.message.ws({ campId }).subscribe();

        return res;
      }, setSubscription);
    };
    newSubscription.ws.addEventListener("close", handleClose);

    // subscriptionRef.on('close')

    // subscription = newSubscription;
    setSubscription(newSubscription);
    return () => {
      newSubscription.ws.removeEventListener("close", handleClose);
      newSubscription.close();
    };
  }, []);

  const [messageWithContextMenuId, setMessageWithContextMenuId] = useState<
    null | string
  >(null);

  return (
    <SocketMessageContext.Provider
      value={{
        subscription,
      }}
    >
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
                  messageWhiteBoardId={
                    whiteBoardMessages.find(
                      ({ messageId }) => messageObj.id === messageId
                    )?.whiteBoardId
                  }
                  campId={campId}
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
        <div className="relative">
          <Textarea
            placeholder="Send a question..."
            onKeyDown={(e) => {
              if (!userMessage && e.key === "Enter" && !e.shiftKey) {
                setUserMessage("");
                e.preventDefault();
                return;
              }

              if (e.key === "Enter" && !e.shiftKey) {
                const parentMessageId = nanoid();

                const newMessage = {
                  campId,
                  createdAt: new Date().toISOString(),
                  id: parentMessageId,
                  message: userMessage,
                  // userId: user.id
                };
                const newThread = {
                  createdAt: new Date().toISOString(),
                  id: nanoid(),
                  parentMessageId: parentMessageId,
                };

                if (!subscription) {
                  console.warn("attempt to send through null sub");
                }

                subscription?.send({
                  message: newMessage,
                  thread: newThread,
                  user,
                });

                updateMessageCache({
                  message: newMessage,
                  thread: newThread,
                  user,
                });

                if (nonCreatedMessageWhiteBoardInfo) {
                  createWhiteBoardMessageMutation.mutate({
                    messageId: parentMessageId,
                    whiteBoardId: nonCreatedMessageWhiteBoardInfo.whiteBoardId,
                    id: nanoid(),
                  });
                }

                // await createWhiteBoardMutation.mutateAsync({
                //   whiteBoardId: messageObj.id,
                // });

                // createMessageWhiteBoard.mutate({
                //   messageId: parentMessageId,
                //   whiteBoardId:
                // })
                setNonCreatedMessageWhiteBoardInfo(null);
                setUserMessage("");
                e.preventDefault();
              }
            }}
            value={userMessage}
            onChange={(event) => setUserMessage(event.target.value)}
            className="flex h-[50px] border-2 border-accent/50 relative"
          />

          <Dialog
            open={whiteBoardDialogOpen}
            onOpenChange={setWhiteBoardDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  if (nonCreatedMessageWhiteBoardInfo) {
                    return;
                  }
                  const whiteBoardId = nanoid();
                  createWhiteBoardMutation.mutate({
                    whiteBoardId,
                  });
                  setNonCreatedMessageWhiteBoardInfo({
                    whiteBoardId,
                    attach: false,
                  });
                }}
                variant={"ghost"}
                className={cn([
                  "absolute top-4 right-3 text-white ",
                  nonCreatedMessageWhiteBoardInfo?.attach &&
                    nonCreatedMessageWhiteBoardInfo.attach &&
                    "h-[50px] px-0 w-[100px]",
                ])}
              >
                {nonCreatedMessageWhiteBoardInfo?.whiteBoardId &&
                nonCreatedMessageWhiteBoardInfo.attach ? (
                  <div className="h-[50px] w-[100px]">
                    <WhiteBoardLoader
                      whiteBoardId={
                        nonCreatedMessageWhiteBoardInfo.whiteBoardId
                      }
                      options={{
                        readOnly: true,
                        scale: 0.08,
                      }}
                    />
                  </div>
                ) : (
                  <Presentation size={20} />
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="min-h-[90vh] min-w-[90vw]">
              <DialogHeader>
                <DialogTitle>Create Whiteboard</DialogTitle>
                <DialogDescription></DialogDescription>
              </DialogHeader>

              {createWhiteBoardMutation.isPending ||
              !createWhiteBoardMutation.variables?.whiteBoardId ? (
                <>
                  <LoadingSection />
                </>
              ) : (
                <WhiteBoardLoader
                  whiteBoardId={createWhiteBoardMutation.variables.whiteBoardId}
                />
              )}

              <DialogFooter>
                <Button
                  onClick={() => {
                    setNonCreatedMessageWhiteBoardInfo((prev) =>
                      prev ? { ...prev, attach: false } : null
                    );
                    setWhiteBoardDialogOpen(false);
                  }}
                  variant={"destructive"}
                >
                  Remove
                </Button>
                <Button
                  variant={"outline"}
                  className="min-w-[78px]"
                  onClick={() => {
                    setNonCreatedMessageWhiteBoardInfo((prev) =>
                      prev ? { ...prev, attach: true } : null
                    );

                    setWhiteBoardDialogOpen(false);
                    // createCampMutation.mutate({
                    //   name: newCampRoomName,
                    // });
                  }}
                >
                  Attach
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </SocketMessageContext.Provider>
  );
});

const ReactionMenuContent = memo(
  ({ messageId, campId }: { messageId: string; campId: string }) => {
    // const { campId } = useParams({ from: "/root-auth/camp-layout/camp/$campId" });
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
              id: nanoid(),
            });
          }}
          variant={"ghost"}
          className="h-7 w-7 p-0"
        >
          <img src={asset.imgSrc} alt={asset.alt} />
        </Button>
      );
    });
  }
);

const Message = memo(
  ({
    messageObj,
    order = "middle",
    setMessageWithContextMenuId,
    messageWithContextMenuId,
    campId,
    messageWhiteBoardId,
  }: {
    messageObj: CampMessage & { user: NonNullable<FiresideUser> };
    order?: "first" | "last" | "middle";
    setMessageWithContextMenuId: Setter<string | null>;
    messageWithContextMenuId: string | null;
    campId: string;
    messageWhiteBoardId: Nullish<string>;
  }) => {
    const { threads } = useGetThreads({ campId });
    const navigate = useNavigate({ from: "/camp/$campId" });
    const thread = threads.find(
      (thread) => thread.parentMessageId === messageObj.id
    );
    // const [ca]
    const createWhiteBoardMutation = useCreateWhiteBoardMutation();
    // const createWhiteBoardMutation = useMutation({
    //   mutationFn: ({ whiteBoardId }: { whiteBoardId: string }) =>
    //     client.api.protected.whiteboard.create.post({ id: whiteBoardId }),
    // });

    const [whiteBoardLocked, setWhiteBoardLocked] = useState(false);
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
                "space-y-4 border-2 border-accent/50 w-full p-3 rounded-md",
                messageWithContextMenuId === messageObj.id && "bg-muted",
              ])}
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-start space-x-2 w-full">
                  <Avatar className="w-10 h-10 grid place-content-center border">
                    <Image size={20} />
                  </Avatar>
                  <div className="text-sm font-medium leading-none">
                    <h3 className="text-base">{messageObj.user.username}</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex gap-x-1">
                        <span>
                          {new Date(messageObj.createdAt).toLocaleDateString()}
                        </span>
                        <span>
                          {new Date(messageObj.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </span>
                    <div className="flex gap-x-1 items-center">
                      {thread?.id ? (
                        <Button
                          onClick={() => {
                            navigate({
                              search: (prev) => ({
                                ...prev,
                                threadId: thread.id,
                              }),
                            });
                          }}
                          variant={"ghost"}
                          className="  h-fit py-1 pl-1 px-1 pb-1 pt-1 pr-1  "
                        >
                          <MessageCircleIcon
                            className="text-primary"
                            size={20}
                          />
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            toast({
                              title: "Thread not available yet",
                              description: "Try again in a few seconds",
                            });
                          }}
                          variant={"ghost"}
                          className="  h-fit py-1 pl-1 px-1 pb-1 pt-1 pr-1  "
                        >
                          <MessageCircleIcon
                            className="text-primary"
                            size={20}
                          />
                        </Button>
                      )}
                      {/* <Button
                        variant={"ghost"}
                        onClick={async () => {
                          await createWhiteBoardMutation.mutateAsync({
                            whiteBoardId: messageObj.id,
                          });
                          navigate({
                            search: (prev) => ({
                              ...prev,
                              whiteBoardId: messageObj.id,
                            }),
                          });
                        }}
                        className={cn([
                          "h-full py-1 px-1",
                          "h-fit  py-1  px-1 pb-1 pt-1 pr-1 pl-1",
                        ])}
                      >
                        <Pencil className="text-primary" size={20} />
                      </Button> */}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button className="h-7 w-7 p-1" variant={"ghost"}>
                            <SmilePlus className="text-primary" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-48 flex flex-wrap gap-2 items-center">
                          <ReactionMenuContent
                            campId={campId}
                            messageId={messageObj.id}
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <div className="flex flex-wrap gap-x-2">
                        <ReactionBox
                          campId={campId}
                          messageId={messageObj.id}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="max-w-none break-words max-h-[700px]">
                {messageObj.message}

                {messageWhiteBoardId && (
                  <WhiteBoardLoader
                    options={{
                      canPan: whiteBoardLocked,
                      readOnly: !whiteBoardLocked,
                      slot: (
                        <Button
                          onClick={() => {
                            setWhiteBoardLocked((prev) => !prev);
                          }}
                          className="absolute top-5 right-5"
                        >
                          {/* <Lock /> */}
                          {whiteBoardLocked ? <Unlock /> : <Lock />}
                        </Button>
                      ),
                    }}
                    whiteBoardId={messageWhiteBoardId}
                  />
                )}
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem className="flex gap-x-2">
              <Edit size={17} /> Edit
            </ContextMenuItem>

            <ContextMenuSub>
              <ContextMenuSubTrigger className="flex gap-x-2 ">
                <SmilePlus size={17} /> Reactions
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48 flex flex-wrap gap-2 items-center">
                <ReactionMenuContent
                  campId={campId}
                  messageId={messageObj.id}
                />
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuItem className="flex gap-x-2 text-destructive">
              <Trash size={17} /> Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>
    );
  }
);

const ReactionBox = memo(
  ({ campId, messageId }: { messageId: string; campId: string }) => {
    const reactMutation = useReactToMessageMutation({ campId });
    const { messageReactions } = useGetMessageReactions({ campId });
    const { reactionAssets } = useGetReactionAssets();
    const removeReactionMutation = useRemoveReactionMutation({ campId });
    const user = useDefinedUser();
    const reactions = messageReactions.filter(
      (reaction) => reaction.messageId === messageId
    );

    const count: Record<string, number> = {};

    reactions.forEach((reaction) =>
      count[reaction.reactionAssetId]
        ? (count[reaction.reactionAssetId] =
            count[reaction.reactionAssetId] + 1)
        : (count[reaction.reactionAssetId] = 1)
    );

    return Object.entries(count).map(([reactionAssetId, count]) => {
      const asset = reactionAssets.find(({ id }) => id === reactionAssetId)!;

      const existingReaction = reactions
        .filter(
          ({ reactionAssetId, messageId }) =>
            reactionAssetId === asset.id && messageId === messageId
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
                messageId: messageId,
                reactionAssetId: asset.id,
                id: nanoid(),
              });
            }}
            className={cn(["h-9 w-9 p-1 ", existingReaction && "bg-muted/50"])}
            variant={"ghost"}
          >
            <img src={asset.imgSrc} alt={asset.alt} />
          </Button>
          {count}
        </div>
      );
    });
  }
);
