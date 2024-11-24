"use client";

import { useWebRTC } from "@/hooks/use-web-rtc";
import { Download, CheckCircle } from "lucide-react";

const SERVER_URL =
  process.env.NEXT_PUBLIC_WEBRTC_SERVER_URL || "http://localhost:8081";

export default function ReceiverPage({
  params,
}: {
  params: { roomId: string };
}) {
  const roomId = params.roomId;

  const { connected, connectionStatus, filesProgress, downloadFile } =
    useWebRTC({
      serverUrl: SERVER_URL,
      role: "receiver",
      roomId: roomId as string,
    });

  if (!roomId) {
    return <div>Loading...</div>;
  }

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

  const downloadAllFiles = () => {
    filesProgress.forEach((file) => {
      if (file.status === "completed") {
        downloadFile(file);
      }
    });
  };

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

          {
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
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                      >
                        {file.status === "completed" ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Download className="w-4 h-4 text-blue-500" />
                        )}
                        <span className="text-sm text-gray-600 truncate flex-1">
                          {file.fileName}
                        </span>
                        <span className="text-xs text-gray-500 min-w-[50px]">
                          {file.status === "completed"
                            ? "Completado"
                            : `${Math.round(file.progress)}%`}
                        </span>
                        {file.status === "completed" && (
                          <button
                            onClick={() => downloadFile(file)}
                            className="p-1 text-blue-500 hover:text-blue-600 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Download all button */}
                  {completedFiles > 0 && (
                    <button
                      onClick={downloadAllFiles}
                      className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Descargar archivos
                    </button>
                  )}
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
          }
        </div>
      </div>
    </div>
  );
}
