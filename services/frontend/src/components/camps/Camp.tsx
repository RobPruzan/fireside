import { useParams } from "@tanstack/react-router";
import { Input } from "../ui/input";
import { useEffect, useRef, useState } from "react";
import { useCreateMessageMutation, useGetMessages,getLikesCountForMessage } from "./camps-state";
import { client } from "@/edenClient"

export const Camp = () => {
  const [userMessage, setUserMessage] = useState<string>("");
  const { campId } = useParams({ from: "/root-auth/camp-layout/camp/$campId" });

  const { messages } = useGetMessages({ campId });
  const scrollRef = useRef<HTMLInputElement | null>(null);

  const [likesCounts, setLikesCounts] = useState<{ [messageId: string]: number }>({});


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

  useEffect(() => {
    const fetchLikesCounts = async () => {
      const likesCountsObj: { [messageId: string]: number } = {};
      for (const message of messages) {
        likesCountsObj[message.id] = await getLikesCountForMessage(message.id);
      }
      setLikesCounts(likesCountsObj);
    };

    fetchLikesCounts();
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
              {messageObj.message}
              <span>{likesCounts[messageObj.id]}</span>
              <button onClick={() => client.api.protected.camp.message.like.post({campId,messageId: messageObj.id})}>
              Like
            </button>
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
