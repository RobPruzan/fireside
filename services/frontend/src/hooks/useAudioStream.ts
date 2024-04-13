// start the audio listen

import { useDefinedUser } from "@/components/camps/camps-state";
import { useGetCamp } from "@/components/camps/message-state";
import { client } from "@/edenClient";
import { useEffect, useRef, useState } from "react";

const throwAwaySubscribeFn = client.api.protected.camp.audio({
  campId: "does not matter",
}).subscribe;

type WebRTCSignal =
  | { kind: "webRTC-candidate"; candidate: RTCIceCandidateInit; userId: string }
  | { kind: "webRTC-offer"; offer: RTCSessionDescriptionInit; userId: string }
  | { kind: "webRTC-answer"; answer: RTCSessionDescriptionInit; userId: string }
  | { kind: "user-joined"; userId: string }
  | { kind: "user-left"; userId: string };
type AudioSubscribeType = ReturnType<typeof throwAwaySubscribeFn>;
export const useWebRTCConnection = ({ campId }: { campId: string }) => {
  const [webRTCConnections, setWebRTCConnections] = useState<
    Array<{ conn: RTCPeerConnection; userId: string }>
  >([]);

  const [connectedUsersForReceiver, setConnectedUsersForReceiver] = useState<
    Array<string>
  >([]);

  const [receiverWebRTCConnection, setReceiverWebRTCConnection] =
    useState<null | RTCPeerConnection>(null);
  const [signalingServerSubscription, setSignalingServerSubscription] =
    useState<AudioSubscribeType | null>(null);

  const { camp } = useGetCamp({ campId });
  const user = useDefinedUser();
  useEffect(() => {
    if (!signalingServerSubscription) {
      return;
    }

    if (camp.createdBy === user.id) {
      const handleOnIceCandidate = ({
        candidate,
      }: RTCPeerConnectionIceEvent) => {
        if (!candidate) {
          return;
        }

        signalingServerSubscription.send({
          kind: "webRTC-candidate",
          candidate,
        });
      };

      webRTCConnections.forEach(({ conn }) => {
        conn.onicecandidate = handleOnIceCandidate;
      });
      return;
    }

    if (!receiverWebRTCConnection) {
      return;
    }

    receiverWebRTCConnection.onicecandidate = ({ candidate }) => {
      if (!candidate) {
        return;
      }

      signalingServerSubscription.send({
        kind: "webRTC-candidate",
        candidate,
      });
    };
  }, [
    webRTCConnections,
    signalingServerSubscription,
    receiverWebRTCConnection,
  ]);

  useEffect(() => {
    if (camp.createdBy === user.id) {
      return;
    }
    const conn = new RTCPeerConnection({
      iceServers: [{ urls: ["stun:stun2.1.google.com:19302"] }],
    });

    setReceiverWebRTCConnection(conn);
  }, []);

  if (user.id === camp.createdBy) {
    console.log({ receiverWebRTCConnection });
  }

  useEffect(() => {
    if (!webRTCConnections) {
      return;
    }
    console.log("creating subscription");
    const subscription = client.api.protected.camp
      .audio({ campId })
      .subscribe();

    setSignalingServerSubscription(subscription);

    return () => {
      console.log("closing subscription");
      subscription.close();
    };
  }, []);

  useEffect(() => {
    if (!signalingServerSubscription) {
      return;
    }

    const handleMessage = async (ws: any) => {
      const typedData: WebRTCSignal = ws.data as any;
      console.log("got message");

      const isBroadcaster = camp.createdBy === user.id;

      // if (isB)

      switch (typedData.kind) {
        case "webRTC-answer": {
          console.log("recieved asnswer but as a broadcaster?", isBroadcaster);
          if (isBroadcaster) {
            const userConn = webRTCConnections.find(
              (existingConn) => existingConn.userId === typedData.userId
            );
            if (!userConn) {
              return;
            }

            userConn.conn.setRemoteDescription(typedData.answer);
            // webRTCConnections.setRemoteDescription(typedData.answer);

            return;
          }

          receiverWebRTCConnection?.setRemoteDescription(typedData.answer);

          return;
        }
        case "webRTC-candidate": {
          if (isBroadcaster) {
            const userConn = webRTCConnections.find(
              (existingConn) => existingConn.userId === typedData.userId
            );
            if (!userConn) {
              return;
            }
            userConn.conn.addIceCandidate(typedData.candidate);
            return;
          }

          receiverWebRTCConnection?.addIceCandidate(typedData.candidate);

          return;
        }
        case "webRTC-offer": {
          if (isBroadcaster) {
            const userConn = webRTCConnections.find(
              (existingConn) => existingConn.userId === typedData.userId
            );
            if (!userConn) {
              return;
            }
            userConn.conn.setRemoteDescription(typedData.offer);

            const answer = await userConn.conn.createAnswer();

            userConn.conn.setLocalDescription(answer);

            signalingServerSubscription.send({
              kind: "webRTC-answer",
              answer,
            });

            return;
          }

          if (!receiverWebRTCConnection) {
            return;
          }

          receiverWebRTCConnection.setRemoteDescription(typedData.offer);

          const answer = await receiverWebRTCConnection?.createAnswer();

          receiverWebRTCConnection.setLocalDescription(answer);

          signalingServerSubscription.send({
            kind: "webRTC-answer",
            answer,
          });
          return;
        }

        case "user-joined": {
          console.log("a user joined", typedData);
          if (isBroadcaster) {
            const conn = new RTCPeerConnection({
              iceServers: [{ urls: ["stun:stun2.1.google.com:19302"] }],
            });

            setWebRTCConnections((prev) => [
              ...(prev ?? []),
              { conn, userId: typedData.userId },
            ]);
            return;
          }

          setConnectedUsersForReceiver((prev) => [
            ...(prev ?? []),
            typedData.userId,
          ]);

          return;
        }

        case "user-left": {
          if (isBroadcaster) {
            setWebRTCConnections((prev) =>
              prev.filter((existingConn) => {
                if (existingConn.userId !== typedData.userId) {
                  existingConn.conn.close();
                  return false;
                }

                return true;
              })
            );

            return;
          }

          if (typedData.userId === camp.createdAt) {
            receiverWebRTCConnection?.close();
          }
          setConnectedUsersForReceiver((prev) =>
            prev.filter((existingUserId) => existingUserId !== typedData.userId)
          );
          return;
        }
      }
    };
    signalingServerSubscription.on("message", handleMessage);

    return () =>
      signalingServerSubscription.removeEventListener("message", handleMessage);
  }, [signalingServerSubscription, webRTCConnections]);

  const listenForAudio = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioTracks = stream.getAudioTracks();
    webRTCConnections.forEach(async ({ conn }) => {
      audioTracks.forEach((track) => {
        conn.addTrack(track, stream);
      });
    });
  };

  return {
    signalingServerSubscription,
    listenForAudio,
    receiverWebRTCConnection,
    webRTCConnections,
  };
};

export const useAudioStream = ({
  campId,
  options,
}: {
  campId: string;
  options?: Partial<{ playAudioStream: boolean }>;
}) => {
  const {
    listenForAudio,
    signalingServerSubscription,
    receiverWebRTCConnection,
    webRTCConnections,
  } = useWebRTCConnection({ campId });

  const listenToBroadcaster = () => {
    if (!receiverWebRTCConnection) {
      return;
    }
    receiverWebRTCConnection.ontrack = ({ track }) => {
      if (track.kind !== "audio") {
        return;
      }
      const audioElement = new Audio();
      audioElement.autoplay = true;
      const audioStream = new MediaStream();

      audioStream.addTrack(track);

      audioElement.srcObject = audioStream;
    };
  };

  // console.log(first)
  const createWebRTCOffer = async () => {
    if (!signalingServerSubscription) {
      console.warn("No signaling server subscription");
      return;
    }

    console.log({ webRTCConnections });

    // if (!receiverWebRTCConnection) {
    //   return;
    // }

    webRTCConnections.forEach(async ({ conn }) => {
      const offer = await conn.createOffer();

      conn.setLocalDescription(offer);

      console.log("sending offer", offer);

      signalingServerSubscription.send({
        kind: "webRTC-offer",
        offer,
      });
    });
  };

  return {
    createWebRTCOffer,
    listenForAudio,
    listenToBroadcaster,
  };
};
