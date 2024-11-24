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

  // Calculate overall progress
  const calculateOverallProgress = () => {
    if (filesProgress.length === 0) return 0;
    const totalProgress = filesProgress.reduce((sum, file) => {
      return sum + (file.status === "completed" ? 100 : file.progress);
    }, 0);
    return totalProgress / filesProgress.length;
  };

  const overallProgress = calculateOverallProgress();
  const completedFiles = filesProgress.filter(
    (file) => file.status === "completed"
  ).length;

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
                  {/* Overall progress section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        Progreso general ({completedFiles} de{" "}
                        {filesProgress.length} archivos)
                      </span>
                      <span className="text-sm text-gray-500">
                        {Math.round(overallProgress)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${overallProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* File list */}
                  <div className="space-y-2">
                    {filesProgress.map((file) => (
                      <div
                        key={`${file.fileName}-${file.status}`}
                        className="flex items-center gap-2"
                      >
                        {file.status === "completed" ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Download className="w-4 h-4 text-blue-500" />
                        )}
                        <span className="text-sm text-gray-600 truncate flex-1">
                          {file.fileName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {file.status === "completed"
                            ? "Completado"
                            : `${Math.round(file.progress)}%`}
                        </span>
                      </div>
                    ))}
                  </div>
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
