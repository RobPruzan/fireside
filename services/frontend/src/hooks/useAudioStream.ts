// start the audio listen

import { client } from "@/edenClient";
import { useEffect, useRef, useState } from "react";

const throwAwaySubscribeFn = client.api.protected.camp.audio({
  campId: "does not matter",
}).subscribe;

type WebRTCSignal =
  | { kind: "webRTC-candidate"; candidate: RTCIceCandidateInit }
  | { kind: "webRTC-offer"; offer: RTCSessionDescriptionInit }
  | { kind: "webRTC-answer"; answer: RTCSessionDescriptionInit };
type AudioSubscribeType = ReturnType<typeof throwAwaySubscribeFn>;
export const useWebRTCConnection = ({ campId }: { campId: string }) => {
  const [webRTCConnection, setWebRTCConnection] =
    useState<RTCPeerConnection | null>(null);
  const [signalingServerSubscription, setSignalingServerSubscription] =
    useState<AudioSubscribeType | null>(null);

  useEffect(() => {
    if (!webRTCConnection) {
      return;
    }
    if (!signalingServerSubscription) {
      return;
    }

    const handleOnIceCandidate = ({ candidate }: RTCPeerConnectionIceEvent) => {
      if (!candidate) {
        return;
      }

      signalingServerSubscription.send({
        kind: "webRTC-candidate",
        candidate,
      });
    };

    webRTCConnection.onicecandidate = handleOnIceCandidate;

    return () => {
      webRTCConnection.removeEventListener(
        "icecandidate",
        handleOnIceCandidate
      );
    };
  }, [webRTCConnection, signalingServerSubscription]);

  useEffect(() => {
    if (!webRTCConnection) {
      return;
    }
    console.log("creating subscription");
    const subscription = client.api.protected.camp
      .audio({ campId })
      .subscribe();

    setSignalingServerSubscription(subscription);

    subscription.on("message", async (ws) => {
      const typedData: WebRTCSignal = ws.data as any;
      console.log("got message");

      switch (typedData.kind) {
        case "webRTC-answer": {
          webRTCConnection.setRemoteDescription(typedData.answer);

          return;
        }
        case "webRTC-candidate": {
          webRTCConnection.addIceCandidate(typedData.candidate);
          return;
        }
        case "webRTC-offer": {
          console.log("recieved offer");
          webRTCConnection.setRemoteDescription(typedData.offer);

          const answer = await webRTCConnection.createAnswer();

          webRTCConnection.setLocalDescription(answer);

          subscription.send({
            kind: "webRTC-answer",
            answer,
          });

          return;
        }
      }
    });

    return () => {
      console.log("closing subscription");
      subscription.close();
    };
  }, [webRTCConnection]);

  console.log({ webRTCConnection, signalingServerSubscription });

  useEffect(() => {
    const conn = new RTCPeerConnection({
      iceServers: [{ urls: ["stun:stun2.1.google.com:19302"] }],
    });

    setWebRTCConnection(conn);
    const handleOnTrack = ({ track }: RTCTrackEvent) => {
      if (track.kind !== "audio") {
        return;
      }
      const audioElement = new Audio();
      audioElement.autoplay = true;
      const audioStream = new MediaStream();

      audioStream.addTrack(track);

      audioElement.srcObject = audioStream;
    };

    conn.ontrack = handleOnTrack;

    return () => conn.removeEventListener("track", handleOnTrack);
  }, []);

  return {
    webRTCConnection,
    signalingServerSubscription,
  };
};

export const useAudioStream = ({
  campId,
  options,
}: {
  campId: string;
  options?: Partial<{ playAudioStream: boolean }>;
}) => {
  const { webRTCConnection, signalingServerSubscription } = useWebRTCConnection(
    { campId }
  );
  const listenForAudio = async () => {
    if (!webRTCConnection) {
      console.log("el");
      console.warn("No web rtc object");
      return;
    }
    // if (!options?.playAudioStream) {
    //   console.log("bigger el");
    //   return;
    // }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioTracks = stream.getAudioTracks();

    audioTracks.forEach((track) => {
      webRTCConnection.addTrack(track, stream);
    });
  };

  const createWebRTCOffer = async () => {
    if (!webRTCConnection) {
      console.warn("No web rtc object");
      return;
    }

    if (!signalingServerSubscription) {
      console.warn("No signaling server subscription");
      return;
    }

    const offer = await webRTCConnection.createOffer();

    webRTCConnection.setLocalDescription(offer);

    console.log("sending offer", offer);

    signalingServerSubscription.send({
      kind: "webRTC-offer",
      offer,
    });
  };

  return {
    createWebRTCOffer,
    listenForAudio,
  };
};
