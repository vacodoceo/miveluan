"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/app/contexts/auth.context";

export type GoogleDriveFile = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
};

const FirebaseDriveIntegration = () => {
  const { user: currentUser, accessToken } = useAuth();

  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [driveAccess, setDriveAccess] = useState(false);

  const checkDriveAccess = useCallback(async () => {
    try {
      // Check if user has granted Drive permissions by attempting to list files
      const response = await fetch(
        "https://www.googleapis.com/drive/v3/files?pageSize=1",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 200) {
        return {
          hasPermissions: true,
          message: "User has granted Drive permissions",
        };
      } else if (response.status === 401 || response.status === 403) {
        return {
          hasPermissions: false,
          message: "User has not granted Drive permissions",
        };
      } else {
        throw new Error(`Unexpected response: ${response.status}`);
      }
    } catch (error) {
      console.error("Error checking Drive permissions:", error);

      return {
        hasPermissions: false,
        message: "Error checking permissions",
        error: (error as Error).message,
      };
    }
  }, [accessToken]);

  useEffect(() => {
    checkDriveAccess().then(({ hasPermissions }) => {
      setDriveAccess(hasPermissions);
    });
  }, [checkDriveAccess]);

  const fetchFiles = async () => {
    try {
      // Get fresh token

      const response = await fetch(
        "https://www.googleapis.com/drive/v3/files?pageSize=10&fields=files(id,name,mimeType,webViewLink)",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }

      const data = await response.json();
      setFiles(data.files);
    } catch (err) {
      setError("Failed to fetch files");
      console.error(err);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {
        <div className="space-y-4">
          <Alert className="mb-4">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Signed in as {currentUser?.displayName}</AlertTitle>
            <AlertDescription>
              {driveAccess
                ? "Tenemos acceso a tu google drive."
                : "Tienes que otorgar permisos para google drive."}
            </AlertDescription>
          </Alert>

          <div className="space-x-2">
            {driveAccess && (
              <button
                onClick={fetchFiles}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Fetch Files
              </button>
            )}
          </div>

          {files.length > 0 && (
            <div className="mt-4">
              <h2 className="text-xl font-bold mb-2">Your Files</h2>
              <div className="space-y-2">
                {files.map((file) => (
                  <div key={file.id} className="p-2 border rounded">
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {file.name}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      }
    </div>
  );
};

export default FirebaseDriveIntegration;
