"use client";

import { useWebRTC } from "@/hooks/use-web-rtc";
import { AlertTriangle, Download, CheckCircle } from "lucide-react";

const SERVER_URL =
  process.env.NEXT_PUBLIC_WEBRTC_SERVER_URL || "http://localhost:8081";

export default function ReceiverPage({
  params,
}: {
  params: { roomId: string };
}) {
  const roomId = params.roomId;

  const { connected, connectionStatus, filesProgress } = useWebRTC({
    serverUrl: SERVER_URL,
    role: "receiver",
    roomId: roomId as string,
  });

  if (!roomId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Recibir archivos</h1>
          <p className="mt-2 text-sm text-gray-600">Código de sala: {roomId}</p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                connected ? "bg-green-500" : "bg-yellow-500"
              }`}
            />
            <span className="text-sm text-gray-600">{connectionStatus}</span>
          </div>

          {connected ? (
            <div className="space-y-4">
              {filesProgress.length > 0 ? (
                <div className="space-y-4">
                  {filesProgress.map((file) => (
                    <div key={file.fileName} className="w-full">
                      <div className="flex items-center gap-2 mb-2">
                        {file.status === "completed" ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Download className="w-5 h-5 text-blue-500" />
                        )}
                        <span className="text-sm text-gray-600 truncate">
                          {file.fileName}
                        </span>
                        <span className="text-sm text-gray-500 ml-auto">
                          {file.status === "completed"
                            ? "100%"
                            : `${Math.round(file.progress)}%`}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-lg">
                  <Download className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    Esperando archivos...
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-yellow-700">
                Conectando con paciente...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
