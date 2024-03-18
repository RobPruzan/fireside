import { useParams } from "@tanstack/react-router";
import { Input } from "../ui/input";
import { Button, buttonVariants } from "../ui/button";
import { useState } from "react";
import { CampMessage } from "@fireside/db";
import { useMutation } from "@tanstack/react-query";
import { toast } from "../ui/use-toast";
import { client } from "@/edenClient";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { makeArrayOptimisticUpdater } from "@/lib/utils";

export const Camp = () => {
  const [userMessage, setUserMessage] = useState<string>("");
  const { campId } = useParams({ from: "/root-auth/camp-layout/camp/$campId" });

  type MessageData = {
    message: string;
    campId: string;
  };

  const options = {
    queryKey: ["messages"],
    queryFn: async () => {
      const res = await client.protected.camp.fetch.messages[campId].get();

      if (res.error) {
        throw new Error(res.error.value);
      }

      return res.data;
    },
    refetchInterval: 5000,
  };

  const messagesQuery = useSuspenseQuery(options);
  const queryClient = useQueryClient();

  const setMessages = makeArrayOptimisticUpdater({
    options,
    queryClient,
  });

  const messages = messagesQuery.data;

  const createMessageMutation = useMutation({
    mutationFn: async (message: MessageData) => {
      const res = await client.protected.camp.create.message.post(message);

      if (res.error) {
        throw new Error(res.error.value);
      }
      return res;
    },
    onError: (e) => {
      toast({
        variant: "destructive",
        title: "Failed to send message.",
        description: e.message,
      });
    },
    onSuccess: ({ data }) => {
      setMessages((prev: CampMessage[]) => [...prev, data]);
    },
  });

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex flex-col w-full h-5/6">
        {messages.map((message, index) => (
          <div key={index} className="message">
            {message.message}
          </div>
        ))}
      </div>

      {/* input */}
      <div className="flex w-full h-1/6 justify-start items-center pr-4">
        <Input
          placeholder="What's on your mind?"
          value={userMessage}
          onChange={(event) => setUserMessage(event.target.value)}
          className="h-12 flex mr-2 ml-2"
        />
        <Button
          disabled={!userMessage}
          onClick={async () => {
            createMessageMutation.mutate({
              message: userMessage,
              campId: campId,
            });
            setUserMessage("");
          }}
        >
          Send
        </Button>
      </div>
    </div>
  );
};
