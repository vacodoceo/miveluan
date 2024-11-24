import { GoogleDriveFile } from "@/components/google-drive";
import {
  getDriveforlderIdIfExists,
  findFile,
  uploadFileToDrive,
  createDriveFolderIfNotExists,
} from "@/lib/google-drive";
import { EXAM_FOLDER_NAME } from "@/constants";

interface ExamFile extends GoogleDriveFile {
  createdTime: string;
  webViewLink: string;
}

export async function listExamsPDFs(accessToken: string): Promise<ExamFile[]> {
  try {
    const folderId = await getDriveforlderIdIfExists(
      EXAM_FOLDER_NAME,
      accessToken
    );
    if (!folderId) {
      return [];
    }

    // Get files from folder, ordered by creation date
    const query = `'${folderId}' in parents and trashed=false`;
    const fields = "files(id,name,mimeType,createdTime,webViewLink)";
    const orderBy = "createdTime desc";

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        query
      )}&fields=${fields}&orderBy=${orderBy}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to list exams from Google Drive");
    }

    const data = await response.json();
    return data.files as ExamFile[];
  } catch (error) {
    console.error("Error listing exams:", error);
    throw new Error("Failed to list exams from Google Drive");
  }
}

export async function getExamPDF(
  fileName: string,
  accessToken: string
): Promise<{ fileName: string; blob: Blob } | null> {
  try {
    const folderId = await getDriveforlderIdIfExists(
      EXAM_FOLDER_NAME,
      accessToken
    );

    if (!folderId) {
      return null;
    }

    const fileId = await findFile(fileName, folderId, accessToken);
    if (!fileId) {
      return null;
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to download exam file from Google Drive");
    }

    const blob = await response.blob();

    return { blob, fileName };
  } catch (error) {
    console.error("Error getting exam file:", error);
    throw new Error("Failed to get exam file from Google Drive");
  }
}

export async function uploadExam(
  file: File,
  accessToken: string
): Promise<ExamFile> {
  try {
    // Ensure folder exists
    const folderId = await createDriveFolderIfNotExists(
      EXAM_FOLDER_NAME,
      accessToken
    );

    // Upload file
    const result = await uploadFileToDrive(file, accessToken, folderId);

    // Get full file details including createdTime and webViewLink
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${result.id}?fields=id,name,mimeType,createdTime,webViewLink`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get uploaded exam details");
    }

    return await response.json();
  } catch (error) {
    console.error("Error uploading exam:", error);
    throw new Error("Failed to upload exam to Google Drive");
  }
}

export async function deleteExam(
  fileName: string,
  accessToken: string
): Promise<void> {
  try {
    const folderId = await getDriveforlderIdIfExists(
      EXAM_FOLDER_NAME,
      accessToken
    );
    if (!folderId) {
      throw new Error("Exams folder not found");
    }

    const fileId = await findFile(fileName, folderId, accessToken);
    if (!fileId) {
      throw new Error("Exam file not found");
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete exam file");
    }
  } catch (error) {
    console.error("Error deleting exam:", error);
    throw new Error("Failed to delete exam from Google Drive");
  }
}
