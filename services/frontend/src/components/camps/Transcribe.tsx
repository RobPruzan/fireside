import { TranscriberContext } from "@/lib/transcription/hooks/useTranscriber";
import { createRef, useContext, useEffect, useState } from "react";
import { useGetTranscription, useGetTranscriptionGroup } from "./camps-state";
import { client } from "@/edenClient";
import { useQueryClient } from "@tanstack/react-query";
import { TranscribeMessageSchema } from "@fireside/backend/src/camp-endpoints";
import { Radio } from "lucide-react";

const foo = client.api.protected.camp.transcribe({ groupId: "..." }).subscribe;

type Subscription = ReturnType<typeof foo>;

export const Transcribe = ({
  campId,
  slot,
}: {
  campId: string;
  slot?: React.ReactNode;
}) => {
  const { transcriptionGroup } = useGetTranscriptionGroup({ campId });

  const { transcription, transcriptionQueryKey } = useGetTranscription({
    groupId: transcriptionGroup?.id!,
    enabled: !!transcriptionGroup?.id,
  });

  const queryClient = useQueryClient();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  // const {transcriber} = useContext(TranscriberContext)

  useEffect(() => {
    if (!transcriptionGroup) {
      return;
    }

    const newSubscription = client.api.protected.camp
      .transcribe({ groupId: transcriptionGroup.id })
      .subscribe();

    setSubscription(newSubscription);

    return () => {
      newSubscription.close();
      setSubscription(null);
    };
  }, [transcriptionGroup]);

  useEffect(() => {
    if (!subscription) {
      return;
    }
    const messagesAtTimeOFStart: { current: number | null } = { current: 0 };
    const handleMessage = (event: { data: string }) => {
      const typedData = JSON.parse(event.data) as TranscribeMessageSchema & {
        id: string;
      };

      queryClient.setQueryData(transcriptionQueryKey, (prev) => [
        ...(prev ?? []),
        typedData,
      ]);
    };

    // setInterval
    subscription.ws.addEventListener("message", handleMessage);

    return () => {
      messagesAtTimeOFStart.current = null;
      // clearTimeout(timeoutId);
      subscription.ws.removeEventListener("message", handleMessage);
    };
  }, [subscription]);

  const skipTokens = [
    " [BLANK_AUDIO]",
    " [ Pause ]",
    " [ Silence ]",
    " (static)",
    " (buzzing)",
    " (whistles)",
    " [",
  ];

  const [_, updateIsActive] = useState(false);
  useEffect(() => {
    const aux = () => {
      setTimeout(() => {
        updateIsActive((prev) => !prev);
        aux();
      }, 1000);
    };

    aux();
  }, []);

  const isActive =
    Date.now() - (transcription?.at(-1)?.createdAt ?? -1) < 10000;
  const filteredTokens = transcription?.filter(
    ({ text }) => !skipTokens.includes(text)
  );
  return (
    <div className="p-3">
      <div>
        <span className="text-3xl font-bold w-full justify-center p-3 flex">
          Live Transcription
        </span>
        {isActive && <Radio className="animate-pulse text-red-500" />}
      </div>
      {slot}
      {filteredTokens?.map((transcription) => (
        <div className="flex items-center gap-x-2">
          <span className="text-muted-foreground">
            {new Date(transcription.createdAt).toLocaleTimeString()}
          </span>

          <div
            className="my-2 border-l-2 pl-3 flex items-center py-2"
            key={transcription.id}
          >
            {transcription.text}
          </div>
        </div>
      ))}

      {filteredTokens?.length === 0 && (
        <div className="text-lg font-bold text-muted-foreground">
          Nothing transcribed yet
        </div>
      )}
    </div>
  );
};
