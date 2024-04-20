// start the audio listen

import { useDefinedUser } from "@/components/camps/camps-state";
import { useGetCamp } from "@/components/camps/message-state";
import { client } from "@/edenClient";
import { camp } from "@fireside/db";
import { serverFnReturnTypeHeader } from "@tanstack/react-router";
import { ReceiptRussianRuble } from "lucide-react";
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
  | {
      kind: "join-channel-request";
      broadcasterId: string;
      userId: string;
      receiverId: string;
    }
  | {
      kind: "join-channel-response";
      broadcasterId: string;
      userId: string;
      receiverId: string;
    }
  | { kind: "leave-channel-request"; broadcasterId: string; userId: string }
  | { kind: "started-broadcast"; userId: string }
  | { kind: "ended-broadcast"; userId: string };
type AudioSubscribeType = ReturnType<typeof throwAwaySubscribeFn>;
export const useWebRTCConnection = ({
  campId,
  options,
}: {
  campId: string;
  options?: Partial<{
    listeningToAudio: boolean;
    broadcastingAudio: boolean;
  }>;
}) => {
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

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const [senders, setSenders] = useState<
    Array<{ userId: string; sender: RTCRtpSender }>
  >([]);

  const [broadcastingToUsers, setBroadcastingToUsers] = useState<Array<string>>(
    []
  );

  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const { camp } = useGetCamp({ campId });
  const user = useDefinedUser();
  useEffect(() => {
    if (!signalingServerSubscription) {
      return;
    }

    if (camp.createdBy === user.id) {
      webRTCConnections.forEach(({ conn, userId }) => {
        conn.onicecandidate = ({ candidate }: RTCPeerConnectionIceEvent) => {
          console.log("candidate");
          if (!candidate) {
            return;
          }

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

    const createSubscription = () =>
      new WebSocket(
        (import.meta.env.PROD ? "wss://" : "ws://") +
          (import.meta.env.PROD ? "fireside.ninja" : "localhost:8080") +
          `/api/protected/camp/audio/${campId}`
      );

    const subscription = createSubscription();

    const retryConnect = (
      callback: () => WebSocket,
      retriesLeft = 7,
      duration = 500
    ) => {
      console.log(`RETRYING (retries left: ${retriesLeft})`);
      if (retriesLeft === 0) {
        return;
      }
      setTimeout(async () => {
        const ws = callback();

        await new Promise((res) => {
          setTimeout(() => {
            res(null);
          }, 1500);
        });

        if (ws.readyState === WebSocket.OPEN) {
          console.log("Reconnected WS connection!");
          setSignalingServerSubscription(ws);
          return;
        }

        retryConnect(callback, retriesLeft - 1, duration * 1.5);
      }, duration);
    };

    const handleClose = () => {
      retryConnect(() => {
        const newSubscription = createSubscription();
        return newSubscription;
      });
    };

    subscription.addEventListener("close", handleClose);

    // subscription.ping()

    setSignalingServerSubscription(subscription);

    return () => {
      console.log("sent close");
      subscription.removeEventListener("close", handleClose);
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
      console.log("kind:", typedData.kind);
      const isBroadcaster = camp.createdBy === user.id;

      switch (typedData.kind) {
        case "webRTC-answer": {
          if (isBroadcaster) {
            const userConn = webRTCConnections.find(
              (existingConn) => existingConn.userId === typedData.userId
            );
            if (!userConn) {
              return;
            }

            userConn.conn.setRemoteDescription(
              new RTCSessionDescription(typedData.answer)
            );

            return;
          }

          receiverWebRTCConnection?.setRemoteDescription(
            new RTCSessionDescription(typedData.answer)
          );

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
          if (!receiverWebRTCConnection) {
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
          if (isBroadcaster) {
            if (!options?.broadcastingAudio) {
              return;
            }
            const conn = new RTCPeerConnection({
              iceServers: [{ urls: ["stun:stun2.1.google.com:19302"] }],
            });
            if (!mediaStream) {
              conn.close();
              return;
            }
            const audioTracks = mediaStream.getAudioTracks();

            audioTracks.forEach((track) => {
              const sender = conn.addTrack(track, mediaStream);
              setSenders((prev) => [
                ...prev,
                { sender, userId: typedData.userId },
              ]);
            });

            setWebRTCConnections((prev) => [
              ...(prev ?? []),
              { conn, userId: typedData.userId },
            ]);

            signalingServerSubscription?.send(
              JSON.stringify({
                kind: "join-channel-request",
                broadcasterId: camp.createdBy,
                receiverId: typedData.userId,
              })
            );
            return;
          } else {
          }

          setConnectedUsersForReceiver((prev) => [
            ...(prev ?? []),
            typedData.userId,
          ]);

          return;
        }
        case "leave-channel-request":
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

            setBroadcastingToUsers((prev) =>
              prev.filter((id) => id !== typedData.userId)
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
        case "join-channel-response": {
          if (!isBroadcaster) {
            return;
          }

          if (!options?.broadcastingAudio) {
            return;
          }

          const userConn = webRTCConnections.find(
            (existingConn) => existingConn.userId === typedData.receiverId
          );
          if (!userConn) {
            return;
          }

          setBroadcastingToUsers((prev) => [...prev, typedData.userId]);

          console.log("creating offer for this conn", { userConn });
          const offer = await userConn.conn.createOffer({
            offerToReceiveAudio: true,
          });

          userConn.conn.setLocalDescription(offer);

          signalingServerSubscription.send(
            JSON.stringify({
              kind: "webRTC-offer",
              offer,
              broadcasterId: camp.createdBy,
              receiverId: typedData.userId,
            })
          );

          return;
        }

        case "join-channel-request": {
          if (!isBroadcaster && typedData.receiverId === user.id) {
            signalingServerSubscription?.send(
              JSON.stringify({
                kind: "join-channel-response",
                broadcasterId: camp.createdBy,
                receiverId: user.id,
              })
            );
          }

          return;
        }

        case "started-broadcast": {
          setIsBroadcasting(true);

          if (options?.listeningToAudio) {
            listenToBroadcaster();
          }

          return;
        }

        case "ended-broadcast": {
          if (isBroadcaster) {
            return;
          }
          setIsBroadcasting(false);
          stopListeningToBroadcast();
          return;
        }
      }
    };

    signalingServerSubscription.addEventListener(
      "message",
      handleMessage,
      true
    );

    return () => {
      signalingServerSubscription.removeEventListener(
        "message",
        handleMessage,
        true
      );
    };
  }, [
    signalingServerSubscription,
    webRTCConnections,
    options?.listeningToAudio,
    options?.broadcastingAudio,
    receiverWebRTCConnection,
    mediaStream,
  ]);

  const listenForAudio = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setMediaStream(stream);
    const audioTracks = stream.getAudioTracks();
    webRTCConnections.forEach(async ({ conn, userId }) => {
      audioTracks.forEach((track) => {
        const sender = conn.addTrack(track, stream);
        setSenders((prev) => [...prev, { sender, userId }]);
      });
    });

    signalingServerSubscription?.send(
      JSON.stringify({
        kind: "started-broadcast",
      })
    );
  };

  const stopListeningForAudio = () => {
    signalingServerSubscription?.send(
      JSON.stringify({
        kind: "ended-broadcast",
        broadcasterId: camp.createdBy,
        receiverId: user.id,
      })
    );
    webRTCConnections.forEach(({ conn, userId }) => {
      const senderObj = senders.find(
        (findSender) => userId === findSender.userId
      );
      if (!senderObj) {
        return;
      }
      try {
        conn.removeTrack(senderObj.sender);
      } catch (e) {
        console.log("bad remove track call");
      }
    });
  };

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

    signalingServerSubscription?.send(
      JSON.stringify({
        kind: "user-joined",
      })
    );
  };

  const stopListeningToBroadcast = () => {
    console.log("no longer listening");
    signalingServerSubscription?.send(
      JSON.stringify({
        kind: "leave-channel-request",
        broadcasterId: camp.createdBy,
        receiverId: user.id,
      })
    );

    const conn = new RTCPeerConnection({
      iceServers: [{ urls: ["stun:stun2.1.google.com:19302"] }],
    });

    receiverWebRTCConnection?.close();

    setReceiverWebRTCConnection(conn);
  };

  const createWebRTCOffer = async () => {
    if (!signalingServerSubscription) {
      console.warn("No signaling server subscription");
      return;
    }
  };

  return {
    signalingServerSubscription,
    listenForAudio,
    stopListeningForAudio,
    receiverWebRTCConnection,
    webRTCConnections,
    setReceiverWebRTCConnection,
    createWebRTCOffer,
    stopListeningToBroadcast,
    listenToBroadcaster,
    broadcastingToUsers,
    isBroadcasting,
  };
};
