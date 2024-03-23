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

  //   const isInViewport = (element) => {
  //     const rect = element.getBoundingClientRect();
  //     return (
  //         rect.top >= 0 &&
  //         rect.left >= 0 &&
  //         rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
  //         rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  //     );
  // }

  const createMessageMutation = useCreateMessageMutation({ campId });

  const handleLike = async (messageId: string) => {
    const response = await client.api.protected.camp.message.like.post({
      campId,
      messageId,
    });

    if (response.data !== null && "totalLikes" in response.data) {
      const { totalLikes } = response.data;
      setLikesCounts((prevLikesCounts) => ({
        ...prevLikesCounts,
        [messageId]: totalLikes,
      }));
    } else {
      setLikesCounts((prevLikesCounts) => ({
        ...prevLikesCounts,
        [messageId]: 0,
      }));
      console.error("Invalid response format");
    }
  };

  return (
    <div className="flex flex-col w-full h-full p-5 gap-y-4">
      <div
        ref={scrollRef}
        className="flex flex-col w-full h-[calc(100%-50px)] overflow-auto gap-y-5"
      >
        {messages
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
          .map((messageObj) => (
            <div className="flex">
              {messageObj.user.email}
              <div className="p-4 border-l-2" key={messageObj.id}>
                {messageObj.message}
              </div>
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
