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
  | { kind: "user-left"; userId: string }
  | { kind: "join-channel-request"; broadcasterId: string };
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
    useState<WebSocket | null>(null);

  const { camp } = useGetCamp({ campId });
  const user = useDefinedUser();
  useEffect(() => {
    if (!signalingServerSubscription) {
      return;
    }

    if (camp.createdBy === user.id) {
      // const handleOnIceCandidate = ({
      //   candidate,
      // }: RTCPeerConnectionIceEvent) => {
      //   if (!candidate) {
      //     return;
      //   }
      //   // broadcasterId: user.id,
      //   // receiverId: userConn.userId

      //   signalingServerSubscription.send(JSON.stringify({
      //     kind: "webRTC-candidate",
      //     candidate,
      //   }));
      // };

      webRTCConnections.forEach(({ conn, userId }) => {
        conn.onicecandidate = ({ candidate }: RTCPeerConnectionIceEvent) => {
          if (!candidate) {
            return;
          }
          // broadcasterId: user.id,
          // receiverId: userConn.userId

          signalingServerSubscription.send(
            JSON.stringify({
              kind: "webRTC-candidate",
              candidate,
              receiverId: userId,
              broadcasterId: camp.createdBy,
            })
          );
        };
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

      signalingServerSubscription.send(
        JSON.stringify({
          kind: "webRTC-candidate",
          candidate,
          broadcasterId: camp.createdBy,
          receiverId: user.id,
        })
      );
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

  useEffect(() => {
    if (!webRTCConnections) {
      return;
    }

    const subscription = new WebSocket(
      (import.meta.env.PROD ? "wss://" : "ws://") +
        (import.meta.env.PROD ? "fireside.ninja" : "localhost:8080") +
        `/api/protected/camp/audio/${campId}`
    );

    // const subscription = client.api.protected.camp
    //   .audio({ campId })
    //   .subscribe();

    setSignalingServerSubscription(subscription);

    return () => {
      subscription.close();
      setSignalingServerSubscription(null);
    };
  }, []);

  useEffect(() => {
    if (!signalingServerSubscription) {
      return;
    }

    const handleMessage = async (ws: any) => {
      const typedData: WebRTCSignal = JSON.parse(ws.data);

      // console.log(ws.data);

      const isBroadcaster = camp.createdBy === user.id;

      // if (isB)

      switch (typedData.kind) {
        case "webRTC-answer": {
          // if (receiverWebRTCConnection?.signalingState === "stable") {
          //   return;
          // }
          if (isBroadcaster) {
            const userConn = webRTCConnections.find(
              (existingConn) => existingConn.userId === typedData.userId
            );
            if (!userConn) {
              return;
            }

            // if (userConn.conn.signalingState !== "stable") {
            userConn.conn.setRemoteDescription(
              new RTCSessionDescription(typedData.answer)
            );
            // }

            // webRTCConnections.setRemoteDescription(typedData.answer);

            return;
          }
          // if (receiverWebRTCConnection?.signalingState !== "stable") {
          receiverWebRTCConnection?.setRemoteDescription(
            new RTCSessionDescription(typedData.answer)
          );
          // }

          return;
        }
        case "webRTC-candidate": {
          // if (receiverWebRTCConnection?.signalingState === "stable") {
          //   return;
          // }
          if (isBroadcaster) {
            const userConn = webRTCConnections.find(
              (existingConn) => existingConn.userId === typedData.userId
            );
            if (!userConn) {
              return;
            }
            userConn.conn.addIceCandidate(
              new RTCIceCandidate(typedData.candidate)
            );
            return;
          }

          receiverWebRTCConnection?.addIceCandidate(
            new RTCIceCandidate(typedData.candidate)
          );

          return;
        }
        case "webRTC-offer": {
          // if (receiverWebRTCConnection?.signalingState === "stable") {
          //   return;
          // }
          if (isBroadcaster) {
            const userConn = webRTCConnections.find(
              (existingConn) => existingConn.userId === typedData.userId
            );
            if (
              !userConn
              // || userConn.conn.signalingState === "stable"
            ) {
              return;
            }

            userConn.conn.setRemoteDescription(
              new RTCSessionDescription(typedData.offer)
            );

            const answer = await userConn.conn.createAnswer();

            userConn.conn.setLocalDescription(answer);

            signalingServerSubscription.send(
              JSON.stringify({
                kind: "webRTC-answer",
                answer,
                broadcasterId: camp.createdBy,
                receiverId: userConn.userId,
              })
            );

            return;
          }

          if (
            !receiverWebRTCConnection
            // ||
            // receiverWebRTCConnection.signalingState === "stable"
          ) {
            return;
          }

          receiverWebRTCConnection.setRemoteDescription(
            new RTCSessionDescription(typedData.offer)
          );

          const answer = await receiverWebRTCConnection?.createAnswer();

          receiverWebRTCConnection.setLocalDescription(answer);

          signalingServerSubscription.send(
            JSON.stringify({
              kind: "webRTC-answer",
              answer,
              broadcasterId: camp.createdBy,
              receiverId: user.id,
            })
          );
          return;
        }

        case "user-joined": {
          // console.log("joined", typedData.userId);
          if (isBroadcaster) {
            const conn = new RTCPeerConnection({
              iceServers: [{ urls: ["stun:stun2.1.google.com:19302"] }],
            });

            setWebRTCConnections((prev) => [
              ...(prev ?? []),
              { conn, userId: typedData.userId },
            ]);
            // console.log("sending join channel request for", typedData.userId);
            signalingServerSubscription?.send(
              JSON.stringify({
                kind: "join-channel-request",
                broadcasterId: camp.createdBy,
                receiverId: typedData.userId,
              })
            );
            return;
          }

          setConnectedUsersForReceiver((prev) => [
            ...(prev ?? []),
            typedData.userId,
          ]);

          return;
        }

        case "user-left": {
          // console.log("left", typedData.userId);
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

            signalingServerSubscription?.send(
              JSON.stringify({
                kind: "leave-channel-request",
                broadcasterId: camp.createdBy,
                receiverId: typedData.userId,
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

        // case "join-channel-request": {
        //   signalingServerSubscription.send(JSON.stringify({
        //     kind: "join-channel",
        //   }));

        //   return;
        // }
      }
    };
    // console.log("event listener");
    // signalingServerSubscription.addEventListener("message", handleMessage);
    // signalingServerSubscription.ws.addEventListener("message", handleMessage);
    // console.log(signalingServerSubscription.ws);
    signalingServerSubscription.addEventListener(
      "message",
      handleMessage,
      true
    );
    // console.log("listenres", signalingServerSubscription);
    return () => {
      // ();
      // signalingServerSubscription.removeEventListener("message", handleMessage);
      signalingServerSubscription.removeEventListener(
        "message",
        handleMessage,
        true
      );
    };
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
  const user = useDefinedUser();
  const { camp } = useGetCamp({ campId });

  const listenToBroadcaster = () => {
    if (!receiverWebRTCConnection) {
      return;
    }

    signalingServerSubscription?.send(
      JSON.stringify({
        kind: "join-channel-request",
        broadcasterId: camp.createdBy,
        receiverId: user.id,
      })
    );
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

  const createWebRTCOffer = async () => {
    console.log("CALLING CREATE OFFER");
    if (!signalingServerSubscription) {
      console.warn("No signaling server subscription");
      return;
    }

    // if (!receiverWebRTCConnection) {
    //   return;
    // }

    console.log({ webRTCConnections });

    webRTCConnections.forEach(async ({ conn, userId }) => {
      const offer = await conn.createOffer();

      conn.setLocalDescription(offer);

      signalingServerSubscription.send(
        JSON.stringify({
          kind: "webRTC-offer",
          offer,
          broadcasterId: camp.createdBy,
          receiverId: userId,
        })
      );
    });
  };

  return {
    createWebRTCOffer,
    listenForAudio,
    listenToBroadcaster,
  };
};
