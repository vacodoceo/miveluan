import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const CHUNK_SIZE = 16384; // 16KB chunks

interface UseWebRTCProps {
  serverUrl: string;
  role: "sender" | "receiver";
  roomId: string;
}

interface FileProgress {
  fileName: string;
  progress: number;
  status: "pending" | "transferring" | "completed" | "error";
}

export const useWebRTC = ({ serverUrl, role, roomId }: UseWebRTCProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(
    role === "sender" ? "Esperando al doctor..." : "Esperando al paciente..."
  );
  const [filesProgress, setFilesProgress] = useState<FileProgress[]>([]);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const receivedChunksRef = useRef<ArrayBuffer[]>([]);
  const receivedSizeRef = useRef(0);
  const currentFileMetadataRef = useRef<any>(null);
  const fileQueueRef = useRef<File[]>([]);
  const isTransferringRef = useRef(false);

  useEffect(() => {
    const newSocket = io(serverUrl);
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [serverUrl]);

  const processNextFile = useCallback(async () => {
    if (isTransferringRef.current || fileQueueRef.current.length === 0) return;

    isTransferringRef.current = true;
    const file = fileQueueRef.current[0];

    try {
      if (!dataChannelRef.current) throw new Error("No data channel available");

      const metadata = {
        name: file.name,
        type: file.type,
        size: file.size,
      };

      dataChannelRef.current.send(JSON.stringify(metadata));

      const arrayBuffer = await file.arrayBuffer();
      let sent = 0;

      for (let i = 0; i < arrayBuffer.byteLength; i += CHUNK_SIZE) {
        const chunk = arrayBuffer.slice(i, i + CHUNK_SIZE);
        dataChannelRef.current.send(chunk);
        sent += chunk.byteLength;

        setFilesProgress((prev) =>
          prev.map((fp) =>
            fp.fileName === file.name
              ? { ...fp, progress: (sent / arrayBuffer.byteLength) * 100 }
              : fp
          )
        );
      }

      // Mark current file as completed
      setFilesProgress((prev) =>
        prev.map((fp) =>
          fp.fileName === file.name
            ? { ...fp, status: "completed", progress: 100 }
            : fp
        )
      );

      // Remove the processed file from queue
      fileQueueRef.current.shift();
      isTransferringRef.current = false;

      // Process next file if available
      processNextFile();
    } catch (error) {
      setFilesProgress((prev) =>
        prev.map((fp) =>
          fp.fileName === file.name ? { ...fp, status: "error" } : fp
        )
      );
      console.error("Error sending file:", error);
      isTransferringRef.current = false;
    }
  }, []);

  const setupDataChannel = useCallback(
    (channel: RTCDataChannel, onOpenText: string, onCloseText: string) => {
      channel.binaryType = "arraybuffer";

      channel.onopen = () => {
        setConnectionStatus(onOpenText);
      };

      channel.onclose = () => {
        setConnectionStatus(onCloseText);
      };

      channel.onmessage = async (event) => {
        if (typeof event.data === "string") {
          const metadata = JSON.parse(event.data);
          currentFileMetadataRef.current = metadata;
          setFilesProgress((prev) => [
            ...prev,
            {
              fileName: metadata.name,
              progress: 0,
              status: "transferring",
            },
          ]);
          receivedChunksRef.current = [];
          receivedSizeRef.current = 0;
        } else {
          receivedChunksRef.current.push(event.data);
          receivedSizeRef.current += event.data.byteLength;

          const progress =
            (receivedSizeRef.current / currentFileMetadataRef.current.size) *
            100;

          setFilesProgress((prev) =>
            prev.map((fp) =>
              fp.fileName === currentFileMetadataRef.current.name
                ? { ...fp, progress }
                : fp
            )
          );

          socket?.emit("chunk-received", {
            roomId,
            chunkId: receivedChunksRef.current.length - 1,
          });

          if (receivedSizeRef.current === currentFileMetadataRef.current.size) {
            const blob = new Blob(receivedChunksRef.current);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = currentFileMetadataRef.current.name;
            a.click();
            URL.revokeObjectURL(url);

            setFilesProgress((prev) =>
              prev.map((fp) =>
                fp.fileName === currentFileMetadataRef.current.name
                  ? { ...fp, status: "completed", progress: 100 }
                  : fp
              )
            );
          }
        }
      };
    },
    [roomId, socket]
  );

  const initiatePeerConnection = useCallback(async () => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    peerConnectionRef.current = peerConnection;

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("signal", {
          roomId,
          signal: { candidate: event.candidate },
        });
      }
    };

    if (role === "sender") {
      const dataChannel = peerConnection.createDataChannel("fileTransfer");
      dataChannelRef.current = dataChannel;
      setupDataChannel(
        dataChannel,
        "Conectado al doctor. Puede enviar los archivos.",
        "Se ha desconectado del doctor."
      );

      socket?.on("peer-joined", async () => {
        try {
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          socket.emit("signal", {
            roomId,
            signal: { offer: offer },
          });
        } catch (error) {
          console.error("Error creating offer:", error);
        }
      });
    } else {
      peerConnection.ondatachannel = (event) => {
        dataChannelRef.current = event.channel;
        setupDataChannel(
          event.channel,
          "Conectado al paciente. Esperando archivos...",
          "Se ha desconectado del paciente."
        );
      };
    }
  }, [role, socket, roomId, setupDataChannel]);

  const joinRoom = useCallback(async () => {
    if (!socket) return;

    socket.emit("join-room", roomId, role, async (success: boolean) => {
      if (success) {
        setConnected(true);
        await initiatePeerConnection();
      } else {
        throw new Error("Error joining room");
      }
    });
  }, [initiatePeerConnection, role, roomId, socket]);

  const sendFiles = async (files: File[]) => {
    // Add new files to the queue and progress tracking
    fileQueueRef.current.push(...files);
    setFilesProgress((prev) => [
      ...prev,
      ...files.map((file) => ({
        fileName: file.name,
        progress: 0,
        status: "pending" as const,
      })),
    ]);

    // Start processing if not already transferring
    if (!isTransferringRef.current) {
      processNextFile();
    }
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("signal", async (data) => {
      try {
        if (!peerConnectionRef.current) return;

        if (data.offer) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.offer)
          );
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          socket.emit("signal", {
            roomId,
            signal: { answer: answer },
          });
        } else if (data.answer) {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
        } else if (data.candidate) {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        }
      } catch (error) {
        console.error("Error handling signal:", error);
      }
    });

    socket.on(
      "room-update",
      ({
        hasReceiver,
        hasSender,
      }: {
        hasReceiver: boolean;
        hasSender: boolean;
      }) => {
        if (role === "sender" && hasReceiver) {
          setConnectionStatus("Hubo un error al conectar con el doctor.");
        } else if (role === "receiver" && hasSender) {
          setConnectionStatus("Hubo un error al conectar con el paciente");
        }
      }
    );

    joinRoom();

    return () => {
      socket.off("signal");
      socket.off("room-update");
      peerConnectionRef.current?.close();
    };
  }, [socket, role, roomId, joinRoom]);

  return {
    connected,
    connectionStatus,
    filesProgress,
    sendFiles,
  };
};
