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
import { DialogFooter } from "../ui/dialog";
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
import {
  ArrowLeft,
  AudioLines,
  BookCheck,
  Captions,
  ChevronLeft,
  ChevronRight,
  Edit,
  Image,
  Menu,
  Info,
  Lock,
  Megaphone,
  MessageCircle,
  MessageCircleIcon,
  Move,
  Pencil,
  PlusCircle,
  Presentation,
  SmilePlus,
  Trash,
  Unlock,
  XIcon,
} from "lucide-react";
import { Avatar } from "../ui/avatar";
import { Nullish, hasKey, run } from "@fireside/utils";
import {
  CampMessage,
  Question,
  QuestionAnswer,
  QuestionOption,
} from "@fireside/db";
import {
  useGetMessages,
  // useCreateMessageMutation,
  useGetMessageReactions,
  useGetReactionAssets,
  useReactToMessageMutation,
  useRemoveReactionMutation,
  useGetCamp,
  // useGetAIMessageBoardAnswer,
} from "./message-state";
import {
  useCreateAnswerMutation,
  useCreateCampMutation,
  useCreateQuestionMutation,
  useUserCamps,
} from "./camps-state";
import {
  useCreateTranscriptionGroup,
  useDefinedUser,
  useGetTranscription,
  useGetTranscriptionGroup,
} from "./camps-state";
import { Setter } from "@/types/utils";
import { FiresideUser } from "@/lib/useUserQuery";
import { ThreadIcon } from "../ui/icons/thread";
import { Thread } from "./Thread";
import { useGetThreads } from "./thread-state";
import { useToast } from "../ui/use-toast";
import { Textarea } from "../ui/textarea";
import { client, promiseDataOrThrow } from "@/edenClient";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { PublishedMessage } from "@fireside/backend/src/message-endpoints";
import { threadId } from "worker_threads";
import { WhiteBoardLoader } from "./whiteboard/WhiteBoard";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Calendar } from "@/components/ui/calendar";
import { Form } from "../ui/form";

import {
  format,
  parse,
  parseISO,
  setHours,
  setMinutes,
  formatISO,
} from "date-fns";
import { CalendarIcon } from "lucide-react";
import { nullable, z } from "zod";

import { cn, retryConnect } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/components/ui/use-toast";

import { useGetPollData } from "./camps-state";

import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
} from "../ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreateAnswerBodyOpts,
  CreateQuestionBodyOpts,
} from "@fireside/backend/src/camp-endpoints";

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

const hasAlertedRef = { current: false };

// import { useAudioStream } from "@/hooks/useAudioStream";
const subscribeFn = client.api.protected.message.ws({
  campId: "anything",
}).subscribe;

type Lol = {
  hour: number;
  minute: number;
  id: string;
};
export const toDateBalls = ({
  pollDate,
  time,
}: {
  pollDate: Date;
  time: Lol;
}) => {
  const newDate = new Date(pollDate);
  newDate.setMinutes(time.minute);
  newDate.setHours(time.hour);
  return newDate;
};

const timeOptions: Array<{ id: string; hour: number; minute: number }> = [];
for (let hour = 0; hour < 24; hour++) {
  for (let minute = 0; minute < 60; minute += 15) {
    timeOptions.push({
      id: crypto.randomUUID(),
      hour,
      minute,
    });
  }
}

const formatHourMinTime = ({
  hour,
  minute,
}: {
  hour: number;
  minute: number;
}) => {
  const suffix = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minute.toString().padStart(2, "0")} ${suffix}`;
};
// type Subscription = null | ReturnType<typeof subscribeFn>;
const SocketMessageContext = createContext<{
  subscription: any | null;
}>({
  subscription: null,
});
export const Camp = () => {
  const { campId } = useParams({ from: "/root-auth/camp-layout/camp/$campId" });

  const { messages } = useGetMessages({ campId });
  const { camp } = useGetCamp({ campId });
  const scrollRef = useRef<HTMLInputElement | null>(null);
  const user = useDefinedUser();
  const [listeningToAudio, setListeningToAudio] = useState(false);
  const [broadcastingAudio, setBroadcastingAudio] = useState(false);

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

  const { toast } = useToast();

  useEffect(() => {
    if (
      navigator.userAgent.toLowerCase().includes("windows") &&
      !hasAlertedRef.current
    ) {
      toast({
        variant: "destructive",
        title: "Awful operating system detected",
        description: "Performance may be impacted.",
      });
      hasAlertedRef.current = true;
    }
  }, []);
  const createWhiteBoardMutation = useCreateWhiteBoardMutation();
  const search = useSearch({ from: "/root-auth/camp-layout/camp/$campId" });
  const createTranscriptionGroupMutation = useCreateTranscriptionGroup();
  const { transcriptionGroupQuery, transcriptionGroup } =
    useGetTranscriptionGroup({ campId });

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
                            {/* {userId.slice(1, 5)} */}
                            <Suspense fallback={<LoadingSpinner />}>
                              <DisplayedAudioUserNames userId={userId} />
                            </Suspense>
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
                          <div className="h-full w-full text-xs overflow-y-auto">
                            <Transcribe
                              slot={
                                <Button
                                  variant={"ghost"}
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
  type Answer = {
    answer: string | null;
    questionId: string | null;
  };
  const [userMessage, setUserMessage] = useState("");
  const { camps } = useUserCamps();
  const user = useDefinedUser();
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
  const [showPoll, setShowPoll] = useState<boolean>(false);
  const [showQuestion, setShowQuestion] = useState<boolean>(false);
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [pollDate, setPollDate] = useState<Date | undefined>();
  const [isHost, setIsHost] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<null | Lol>(null);
  const [endTime, setEndTime] = useState<null | Lol>(null);
  const [pollQuestion, setPollQuestion] = useState("");
  const createQuestionMutation = useCreateQuestionMutation();
  const createAnswerMutation = useCreateAnswerMutation();
  const [question, setQuestion] = useState<Question | null>(null);
  const [questionOptions, setQuestionOptions] = useState<QuestionOption[]>([]);
  const [showPollData, setShowPollData] = useState<boolean>(false);
  const [currentAnswer, setCurrentAnswer] = useState<Answer>({
    answer: null,
    questionId: null,
  });

  const { pollDataInfo } = useGetPollData({ campId });

  const subscribeFn2 = client.api.protected.camp["retrieve-questions"]({
    campId: 2 as unknown as string,
  }).subscribe;

  // const questionsQuery = useSuspenseQuery({
  //   queryKey: ["questions", campId],
  //   queryFn: () =>
  //     client.api.protected.camp["retrieve-questions"]({
  //       campId: campId,
  //     })
  //       .get()
  //       .then((json) => {
  //         if (!json.data) {
  //           setQuestion(null);
  //           setQuestionOptions([]);
  //           throw new Error("bad data");
  //         }
  //         setQuestion(json.data.question!);
  //         setQuestionOptions(json.data?.questionOptions);
  //         return json.data;
  //       })
  //       .catch((error) => console.log("Error: ", error)),
  // });

  const addOption = () => {
    if (options.length < 5) {
      setOptions([...options, ""]);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = options.map((option, i) =>
      i === index ? value : option
    );
    setOptions(updatedOptions);
  };

  const [nonCreatedMessageWhiteBoardInfo, setNonCreatedMessageWhiteBoardInfo] =
    useState<null | { whiteBoardId: string; attach: boolean }>(null);

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
  }, [messages.length, whiteBoardMessages.length]);

  // determine if user is host
  useEffect(() => {
    setIsHost(false);

    const camp = camps.filter((camp) => camp.id == campId)[0];
    const is_host = camp.createdBy == user.id;

    setIsHost(is_host);
  }, [campId]);

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

  const [subscription2, setSubscription2] = useState<null | ReturnType<
    typeof subscribeFn2
  >>(null);

  useEffect(() => {
    console.log("ASDF1");
    if (!subscription2) {
      return;
    }
    const handleMessage = async (event: { data: string }) => {
      console.log({ event });

      const typedData:
        | {
            kind: "exists";
            questionOptions: Array<QuestionOption>;
            validQuestion: Question;
          }
        | {
            kind: "not-exists";
          } = JSON.parse(event.data);

      switch (typedData.kind) {
        case "exists": {
          console.log("YESSS");
          setQuestion(typedData.validQuestion);
          setQuestionOptions(typedData.questionOptions);
          return;
        }
        case "not-exists": {
          setQuestion(null);
          setQuestionOptions([]);
          return;
        }
      }

      typedData satisfies never;
    };
    subscription2.ws.addEventListener("message", handleMessage);

    return () => {
      if (!subscription2) {
        return;
      }
      subscription2.ws.removeEventListener("message", handleMessage);
    };
  }, [subscription2]);

  useEffect(() => {
    const newSubscription2 = client.api.protected.camp["retrieve-questions"]({
      campId,
    }).subscribe();

    const handleOpen = () => {
      setSubscription2(newSubscription2);

      // ....
    };
    newSubscription2.ws.addEventListener("open", handleOpen);

    const handleClose = () => {
      retryConnect(() => {
        const res = client.api.protected.camp["retrieve-questions"]({
          campId,
        }).subscribe();

        return res;
      }, setSubscription2);

      newSubscription2.ws.addEventListener("close", handleClose);
      setSubscription2(newSubscription2);
    };
    return () => {
      newSubscription2.ws.removeEventListener("close", handleClose);

      newSubscription2.ws.removeEventListener("open", handleOpen); // probably dont need this since its gonna close
      newSubscription2.close();
    };
  }, [campId]);

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

  function handlePollCreation() {
    if (
      !pollDate ||
      !startTime ||
      !endTime ||
      options.some((option) => option.trim() === "") ||
      pollQuestion.trim() === ""
    ) {
      toast({
        title: "Error",
        description: "All fields must be filled, and options cannot be empty.",
      });
      return;
    }

    if (endTime.hour < startTime.hour) {
      toast({
        title: "Error",
        description: "End time must be after start time.",
      });
      return;
    }

    if (endTime.hour === startTime.hour && endTime.minute < startTime.minute) {
      toast({
        title: "Error",
        description: "End time must be after start time.",
      });
      return;
    }

    // console.log(
    //   "STARTING TIME SENDING",
    //   toDateBalls({ pollDate, time: startTime }).toString().toLocaleString()
    // );

    // console.log(
    //   "ENDING TIME SENDING",
    //   toDateBalls({ pollDate, time: endTime }).toString().toLocaleString()
    // );

    const pollData = {
      questionText: pollQuestion,
      dateOfCreation: pollDate.toString(),
      startTime: toDateBalls({ pollDate, time: startTime }).toString(),
      endTime: toDateBalls({ pollDate, time: endTime }).toString(),
      campId: campId,
    };

    const questionOptions = {
      options: options.filter((option) => option.trim() !== ""),
    };

    console.log("Submitting poll creation data:", pollData);

    toast({
      title: "Success",
      description: "Poll created successfully.",
    });

    createQuestionMutation.mutate({
      question: pollData,
      questionOptions: questionOptions.options,
    });

    setPollDate(undefined);
    setStartTime(null);
    setEndTime(null);
    setOptions(["", ""]);
    setPollQuestion("");
  }

  const countUniqueAnswers = (answers: QuestionAnswer[]) => {
    const countMap = new Map();

    answers.forEach(({ answer }) => {
      countMap.set(answer, (countMap.get(answer) || 0) + 1);
    });

    return countMap;
  };

  return (
    <SocketMessageContext.Provider
      value={{
        subscription,
      }}
    >
      <Menubar className="flex w-full h-70px bg-opacity-20 backdrop-blur-md">
        <MenubarMenu>
          {isHost && (
            <Button size={"sm"} onClick={() => setShowPoll(true)}>
              Create Poll
            </Button>
          )}

          {isHost && (
            <Button
              size={"sm"}
              onClick={async () => {
                setShowPollData(true);
                await queryClient.refetchQueries({
                  queryKey: ["poll-information"],
                });
              }}
            >
              View Poll Details
            </Button>
          )}

          {question ? (
            <Button
              size={"sm"}
              onClick={() => {
                setShowQuestion(true);
                setCurrentAnswer({ answer: null, questionId: null }); // set both to null on question
              }}
            >
              View Question
            </Button>
          ) : null}
        </MenubarMenu>
      </Menubar>

      <Dialog
        open={showPollData}
        onOpenChange={(isOpen) => setShowPollData(isOpen)}
      >
        <DialogTrigger asChild></DialogTrigger>
        <DialogContent className="overflow-y-scroll h-3/4 w-1/2">
          <DialogHeader>Question Statistics:</DialogHeader>

          {pollDataInfo.map((pollData, index) => (
            <div key={index}>
              <hr></hr>
              Question:
              <h3 className="font-bold text-lg mt-4 mb-2">
                {pollData.question.questionText}?
              </h3>
              <ul>
                {(() => {
                  const counts: { [key: string]: number } = {};
                  pollData.answers.forEach((answer) => {
                    counts[answer.answer] = (counts[answer.answer] || 0) + 1;
                  });
                  return Object.entries(counts).map(([answer, count], idx) => (
                    <li key={idx} className="ml-4">
                      {answer}:{" "}
                      {((count / pollData.answers.length) * 100).toFixed(2)}
                      {"% "}
                      of all answers {`(${count}/${pollData.answers.length})`}
                    </li>
                  ));
                })()}
              </ul>
            </div>
          ))}
        </DialogContent>
      </Dialog>

      <Dialog
        open={showQuestion}
        onOpenChange={(isOpen) => setShowQuestion(isOpen)}
      >
        <DialogTrigger asChild></DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{question?.questionText}?</DialogTitle>
            <hr></hr>
          </DialogHeader>
          {questionOptions.map((option, index) => (
            <label key={option.id} className="block mb-3">
              <div className="text-[16px] font-semibold mb-1">
                Option {index + 1}:
              </div>
              <input
                type="radio"
                value={option.optionText}
                name="question"
                className="mr-2"
                onChange={() =>
                  setCurrentAnswer({
                    answer: option.optionText,
                    questionId: option.questionId,
                  })
                }
              />
              {option.optionText}
            </label>
          ))}
          <Button
            size={"sm"}
            onClick={() =>
              createAnswerMutation.mutate({
                answer: currentAnswer.answer!,
                questionId: currentAnswer.questionId!,
                userId: user.id,
              })
            }
          >
            Submit
          </Button>
          <hr></hr>
          <div>
            <strong>Start Time:</strong>{" "}
            {new Date(question?.startTime!).toLocaleTimeString()}
          </div>
          <div>
            <strong>End Time:</strong>{" "}
            {new Date(question?.endTime!).toLocaleTimeString()}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showPoll}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setOptions(["", ""]);
            setPollQuestion("");
            setPollDate(undefined);
            setStartTime(null);
            setEndTime(null);
          }
          setShowPoll(false);
        }}
      >
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid max-w-xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-8 shadow-lg duration-200">
          <DialogTitle className="text-center">
            Create a new Question
          </DialogTitle>
          <DialogDescription>
            Enter your question and provide options for users to choose from
          </DialogDescription>
          <Input
            id="pollQuestion"
            type="text"
            placeholder="Enter question..."
            required
            autoFocus
            className="mt-1"
            onChange={(e) => setPollQuestion(e.target.value)}
            value={pollQuestion}
          />

          {options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
              />
            </div>
          ))}

          {options.length < 5 && (
            <button
              onClick={addOption}
              className="flex items-center mt-2 text-primary"
            >
              <PlusCircle className="icon-class mr-2" /> Add Option
            </button>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className={cn("w-[175px] text-left")}>
                {pollDate ? format(pollDate, "PPP") : "Choose Date"}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={pollDate}
                onSelect={setPollDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <div className="flex justify-evenly items-start ">
            <DialogDescription>Start Time:</DialogDescription>
            <Select
              value={startTime?.id}
              onValueChange={(timeId) => {
                const time = timeOptions.find(
                  ({ id: searchId }) => searchId === timeId
                )!;
                setStartTime(time);
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Start Time" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {formatHourMinTime(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DialogDescription>End Time:</DialogDescription>
            <Select
              value={endTime?.id}
              onValueChange={(timeId) => {
                const time = timeOptions.find(
                  ({ id: searchId }) => searchId === timeId
                )!;

                setEndTime(time);
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="End Time" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {formatHourMinTime(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => {
              handlePollCreation();
            }}
          >
            Create Poll
          </Button>
        </DialogContent>
      </Dialog>

      <div className="p-1 flex flex-col h-full w-full px-2">
        <div className="flex w-full h-[calc(100%-125px)] ">
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
    const { transcriptionGroup } = useGetTranscriptionGroup({ campId });
    const { transcription } = useGetTranscription({
      groupId: transcriptionGroup?.id!,
      enabled: !!transcriptionGroup?.id,
    });

    // const aiMessageBoardAnswerQuery = useGetAIMessageBoardAnswer({
    //   transcriptGroupId: transcriptionGroup?.id,
    //   messageId: messageObj.id,
    // });

    // console.log({ d: aiMessageBoardAnswerQuery.data });
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
      <>
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
                            {new Date(
                              messageObj.createdAt
                            ).toLocaleDateString()}
                          </span>
                          <span>
                            {new Date(
                              messageObj.createdAt
                            ).toLocaleTimeString()}
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
                <pre className="max-w-none break-words max-h-[700px] font-sans text-wrap">
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
                </pre>
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
        {/* <div className="text-xs text-muted-foreground">
          {run(() => {
            switch (aiMessageBoardAnswerQuery.data?.kind) {
              case "success": {
                return (
                  <div className="flex flex-col gap-y-3">
                    <div>
                      {aiMessageBoardAnswerQuery.data.relevantTranscript &&
                        "Transcription: "}
                      {aiMessageBoardAnswerQuery.data.relevantTranscript}
                    </div>

                    <div>
                      Attempted Answer:{" "}
                      {aiMessageBoardAnswerQuery.data.attemptedAnswer}
                    </div>
                  </div>
                );
              }
            }
          })}
        </div> */}
      </>
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

const DisplayedAudioUserNames = ({ userId }: { userId: string }) => {
  const { data } = useSuspenseQuery({
    queryKey: ["user-name", userId],
    queryFn: () =>
      promiseDataOrThrow(
        client.api.protected.user["user-name"]({ userId }).get()
      ),
  });

  return data.username;
};
