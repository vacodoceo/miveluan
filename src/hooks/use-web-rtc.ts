import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const CHUNK_SIZE = 16384; // 16KB chunks

interface UseWebRTCProps {
  serverUrl: string;
  role: "sender" | "receiver";
  roomId: string;
}

export const useWebRTC = ({ serverUrl, role, roomId }: UseWebRTCProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(
    role === "sender" ? "Esperando al doctor..." : "Esperando al paciente..."
  );
  const [progress, setProgress] = useState(0);
  const [currentFileName, setCurrentFileName] = useState<string>("");

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const receivedChunksRef = useRef<ArrayBuffer[]>([]);
  const receivedSizeRef = useRef(0);
  const currentFileMetadataRef = useRef<any>(null);

  useEffect(() => {
    const newSocket = io(serverUrl);
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [serverUrl]);

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
          setCurrentFileName(metadata.name);
          receivedChunksRef.current = [];
          receivedSizeRef.current = 0;
          setProgress(0);
        } else {
          receivedChunksRef.current.push(event.data);
          receivedSizeRef.current += event.data.byteLength;

          const progress =
            (receivedSizeRef.current / currentFileMetadataRef.current.size) *
            100;
          setProgress(progress);

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
            setProgress(0);
            setCurrentFileName("");
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
        alert("Hubo un error al unirse a la sala.");
      }
    });
  }, [initiatePeerConnection, role, roomId, socket]);

  const sendFile = async (file: File) => {
    if (!dataChannelRef.current) return;
    setCurrentFileName(file.name);

    const metadata = {
      name: file.name,
      type: file.type,
      size: file.size,
    };

    dataChannelRef.current.send(JSON.stringify(metadata));

    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target!.result as ArrayBuffer;
      let sent = 0;
      for (let i = 0; i < arrayBuffer.byteLength; i += CHUNK_SIZE) {
        const chunk = arrayBuffer.slice(i, i + CHUNK_SIZE);
        dataChannelRef.current?.send(chunk);
        sent += chunk.byteLength;
        setProgress((sent / arrayBuffer.byteLength) * 100);
      }
    };
    reader.readAsArrayBuffer(file);
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

    socket.on("room-update", () => {
      if (role === "sender") {
        setConnectionStatus("Hubo un error al conectar con el doctor.");
      } else if (role === "receiver") {
        setConnectionStatus("Hubo un error al conectar con el paciente");
      }
    });

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
    progress,
    currentFileName,
    sendFile,
  };
};
