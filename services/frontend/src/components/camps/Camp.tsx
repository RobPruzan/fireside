import { useParams } from "@tanstack/react-router";
import { Input } from "../ui/input";
import { useEffect, useRef, useState } from "react";
import { useCreateMessageMutation, useGetMessages } from "./camps-state";
import { client } from "@/edenClient";

export const Camp = () => {
  const [userMessage, setUserMessage] = useState<string>("");
  const { campId } = useParams({ from: "/root-auth/camp-layout/camp/$campId" });

  const { messages } = useGetMessages({ campId });
  const scrollRef = useRef<HTMLInputElement | null>(null);

  const [likesCounts, setLikesCounts] = useState<{ [messageId: string]: number }>({});

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

  const handleLike = async (messageId: string) => {
    const response = await client.api.protected.camp.message.like.post({ campId, messageId });
    
    if (response.data !== null && 'totalLikes' in response.data) {
      const { totalLikes } = response.data;
      setLikesCounts(prevLikesCounts => ({
        ...prevLikesCounts,
        [messageId]: totalLikes
      }));
    } else {
    
      setLikesCounts(prevLikesCounts => ({
        ...prevLikesCounts,
        [messageId]: 0
      }));
      console.error('Invalid response format');
    }
  };

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
              <button onClick={() => handleLike(messageObj.id)}>
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
