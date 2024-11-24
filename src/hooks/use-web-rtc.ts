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
  blob?: Blob;
  type?: string;
}

export const useWebRTC = ({ serverUrl, role, roomId }: UseWebRTCProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(
    role === "sender" ? "Esperando al doctor..." : "Esperando al paciente..."
  );
  const [filesProgress, setFilesProgress] = useState<FileProgress[]>([]);
  const [isReceiverConnected, setIsReceiverConnected] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const fileReceiveStatesRef = useRef<
    Map<
      string,
      {
        chunks: ArrayBuffer[];
        receivedSize: number;
        metadata: any;
      }
    >
  >(new Map());
  const fileQueueRef = useRef<File[]>([]);
  const isTransferringRef = useRef(false);
  const [transferCompleted, setTransferCompleted] = useState(false);

  const updateFileProgress = useCallback(
    (fileName: string, updates: Partial<FileProgress>) => {
      setFilesProgress((prev) => {
        const fileIndex = prev.findIndex((fp) => fp.fileName === fileName);
        if (fileIndex === -1) return prev;

        const newProgress = [...prev];
        newProgress[fileIndex] = { ...newProgress[fileIndex], ...updates };
        return newProgress;
      });
    },
    []
  );

  const setupDataChannel = useCallback(
    (channel: RTCDataChannel, onOpenText: string, onCloseText: string) => {
      channel.binaryType = "arraybuffer";

      channel.onopen = () => {
        setConnectionStatus(onOpenText);
        setIsReceiverConnected(true);
      };

      channel.onclose = () => {
        setConnectionStatus(onCloseText);
        setIsReceiverConnected(false);
      };

      channel.onmessage = async (event) => {
        if (typeof event.data === "string") {
          // New file transfer starting
          const metadata = JSON.parse(event.data);
          fileReceiveStatesRef.current.set(metadata.name, {
            chunks: [],
            receivedSize: 0,
            metadata: metadata,
          });

          // Add new file to progress tracking
          setFilesProgress((prev) => [
            ...prev,
            {
              fileName: metadata.name,
              progress: 0,
              status: "transferring",
              type: metadata.type,
            },
          ]);
        } else {
          // Handle chunk received
          const currentFile = Array.from(
            fileReceiveStatesRef.current.entries()
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ).find(([_, state]) => state.receivedSize < state.metadata.size);

          if (!currentFile) return;

          const [fileName, state] = currentFile;
          state.chunks.push(event.data);
          state.receivedSize += event.data.byteLength;

          // Update progress
          const progress = (state.receivedSize / state.metadata.size) * 100;
          updateFileProgress(fileName, { progress });

          // Check if file is complete
          if (state.receivedSize === state.metadata.size) {
            const blob = new Blob(state.chunks, { type: state.metadata.type });
            updateFileProgress(fileName, {
              status: "completed",
              progress: 100,
              blob: blob,
            });

            // Clean up the state for this file
            fileReceiveStatesRef.current.delete(fileName);
          }

          socket?.emit("chunk-received", {
            roomId,
            chunkId: state.chunks.length - 1,
          });
        }
      };
    },
    [roomId, socket, updateFileProgress]
  );

  const downloadFile = (fileProgress: FileProgress) => {
    if (!fileProgress.blob) return;

    const url = URL.createObjectURL(fileProgress.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileProgress.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Socket connection setup
  useEffect(() => {
    const newSocket = io(serverUrl);
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [serverUrl]);

  // Peer connection setup and room joining logic
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

    peerConnection.oniceconnectionstatechange = () => {
      if (peerConnection.iceConnectionState === "connected") {
        setIsReceiverConnected(true);
      } else if (
        ["disconnected", "failed", "closed"].includes(
          peerConnection.iceConnectionState
        )
      ) {
        setIsReceiverConnected(false);
      }
    };
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

        updateFileProgress(file.name, {
          progress: (sent / arrayBuffer.byteLength) * 100,
        });
      }

      updateFileProgress(file.name, { status: "completed", progress: 100 });

      fileQueueRef.current.shift();
      isTransferringRef.current = false;

      if (fileQueueRef.current.length === 0) {
        // All files have been sent
        socket?.emit("files-completed", roomId);
        setTransferCompleted(true);
        setConnectionStatus("Envío de archivos terminado");
      } else {
        processNextFile();
      }
    } catch (error) {
      updateFileProgress(file.name, { status: "error" });
      console.error("Error sending file:", error);
      isTransferringRef.current = false;
    }
  }, [updateFileProgress, socket, roomId]);

  const sendFiles = async (files: File[]) => {
    fileQueueRef.current.push(...files);
    setFilesProgress((prev) => [
      ...prev,
      ...files.map((file) => ({
        fileName: file.name,
        progress: 0,
        status: "pending" as const,
      })),
    ]);

    if (!isTransferringRef.current) {
      processNextFile();
    }
  };

  const disconnect = useCallback(async () => {
    // Close connections but keep file progress state
    dataChannelRef.current?.close();
    peerConnectionRef.current?.close();

    setConnected(false);
    setIsReceiverConnected(false);
    setConnectionStatus(
      role === "sender"
        ? "Desconectado del doctor."
        : "Desconectado del paciente."
    );

    // Only clear transfer-related state
    fileReceiveStatesRef.current.clear();
    fileQueueRef.current = [];
    isTransferringRef.current = false;

    if (socket) {
      socket.emit("leave-room", roomId);
    }
  }, [role, roomId, socket]);

  // Socket event handlers setup
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

    joinRoom();

    return () => {
      socket.off("signal");
      socket.off("room-update");
      peerConnectionRef.current?.close();
      setIsReceiverConnected(false);
    };
  }, [socket, role, roomId, joinRoom]);

  useEffect(() => {
    if (!socket) return;

    socket.on("transfer-completed", () => {
      setTransferCompleted(true);
      setConnectionStatus(
        role === "sender"
          ? "Envío de archivos terminado."
          : "Recepción de archivos terminada."
      );
    });

    socket.on("force-disconnect", () => {
      disconnect();
    });

    return () => {
      socket.off("transfer-completed");
      socket.off("force-disconnect");
    };
  }, [socket, role, disconnect]);

  return {
    connected,
    connectionStatus,
    filesProgress,
    sendFiles,
    isReceiverConnected,
    disconnect,
    downloadFile,
    transferCompleted,
  };
};
