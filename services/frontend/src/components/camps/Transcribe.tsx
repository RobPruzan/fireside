import { TranscriberContext } from "@/lib/transcription/hooks/useTranscriber";
import { useContext, useEffect, useState } from "react";
import { useGetTranscription, useGetTranscriptionGroup } from "./camps-state";
import { client } from "@/edenClient";
import { useQueryClient } from "@tanstack/react-query";
import { TranscribeMessageSchema } from "@fireside/backend/src/camp-endpoints";

const foo = client.api.protected.camp.transcribe({ groupId: "..." }).subscribe;

type Subscription = ReturnType<typeof foo>;

export const Transcribe = ({ campId }: { campId: string }) => {
  console.log("hi!!");
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

    console.log("creating sub");
    const newSubscription = client.api.protected.camp
      .transcribe({ groupId: transcriptionGroup.id })
      .subscribe();

    setSubscription(newSubscription);

    return () => {
      newSubscription.close();
      setSubscription(null);
    };
  }, [transcriptionGroup]);
  console.log("curr transcriptipn", transcription);

  useEffect(() => {
    if (!subscription) {
      return;
    }
    const handleMessage = (event: { data: string }) => {
      const typedData = JSON.parse(event.data) as TranscribeMessageSchema & {
        id: string;
      };

      console.log("recieved message", typedData);

      queryClient.setQueryData(transcriptionQueryKey, (prev) => [
        ...(prev ?? []),
        typedData,
      ]);
    };
    subscription.ws.addEventListener("message", handleMessage);

    return () => {
      subscription.ws.removeEventListener("message", handleMessage);
    };
  }, [subscription]);

  return (
    <div>
      {transcription?.map((transcription) => (
        <div key={transcription.id}>{transcription.text}</div>
      ))}
    </div>
  );
};
