"use client";

import { useCallback } from "react";
import { AlertTriangle, Upload, CheckCircle } from "lucide-react";
import { useWebRTC } from "@/hooks/use-web-rtc";

const SERVER_URL =
  process.env.NEXT_PUBLIC_WEBRTC_SERVER_URL || "http://localhost:3001";

export default function SenderPage({ params }: { params: { roomId: string } }) {
  const roomId = params.roomId;

  const { connected, connectionStatus, progress, currentFileName, sendFile } =
    useWebRTC({
      serverUrl: SERVER_URL,
      role: "sender",
      roomId: roomId as string,
    });

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        sendFile(file);
      }
    },
    [sendFile]
  );

  if (!roomId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Send File</h1>
          <p className="mt-2 text-sm text-gray-600">Room ID: {roomId}</p>
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
              <div className="flex justify-center">
                {!currentFileName ? (
                  <label className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400">
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        Click to select a file
                      </span>
                    </div>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="w-full">
                    <div className="flex items-center gap-2 mb-2">
                      {progress === 100 ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Upload className="w-5 h-5 text-blue-500" />
                      )}
                      <span className="text-sm text-gray-600">
                        {currentFileName}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-yellow-700">
                Waiting for receiver to join...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
