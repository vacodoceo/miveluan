"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type GoogleDriveFile = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
};

const GoogleDriveOAuth = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Replace these with your own credentials from Google Cloud Console
  const CLIENT_ID =
    "537985006484-ac5ln11mo8uuqpdqros5op95kt78q56e.apps.googleusercontent.com";
  const REDIRECT_URI = "http://localhost:3000/google-drive";
  const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];

  useEffect(() => {
    // Check if we're handling the OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      exchangeCodeForToken(code);
    }

    // Check if we have a stored token
    const storedToken = localStorage.getItem("googleDriveToken");
    if (storedToken) {
      setAccessToken(storedToken);
    }
  }, []);

  const initiateOAuth = () => {
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    const params = {
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: SCOPES.join(" "),
      access_type: "offline",
      prompt: "consent",
    };

    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();
  };

  const exchangeCodeForToken = async (code: string) => {
    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: "YOUR_CLIENT_SECRET", // Note: In production, this should be handled by your backend
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
          code: code,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.access_token) {
        setAccessToken(tokenData.access_token);
        localStorage.setItem("googleDriveToken", tokenData.access_token);
        // Remove the code from URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      } else {
        throw new Error("Failed to get access token");
      }
    } catch (err) {
      setError("Failed to exchange code for token");
      console.error(err);
    }
  };

  const fetchFiles = async () => {
    try {
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

  const downloadFile = async (fileId: string) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      // Create a download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileId; // You might want to use the actual filename here
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError("Failed to download file");
      console.error(err);
    }
  };

  const handleSignOut = () => {
    setAccessToken(null);
    setFiles([]);
    localStorage.removeItem("googleDriveToken");
    // Optionally revoke access
    if (accessToken) {
      fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
        method: "POST",
      });
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

      {accessToken ? (
        <div className="space-y-4">
          <Alert className="mb-4">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Connected to Google Drive</AlertTitle>
            <AlertDescription>You can now access your files.</AlertDescription>
          </Alert>

          <div className="space-x-2">
            <button
              onClick={fetchFiles}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Fetch Files
            </button>
            <button
              onClick={handleSignOut}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>

          <div className="mt-4">
            <h2 className="text-xl font-bold mb-2">Your Files</h2>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="p-2 border rounded flex justify-between items-center"
                >
                  <span>{file.name}</span>
                  <button
                    onClick={() => downloadFile(file.id)}
                    className="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={initiateOAuth}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Connect to Google Drive
        </button>
      )}
    </div>
  );
};

export default GoogleDriveOAuth;
