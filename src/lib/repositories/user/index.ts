import {
  upsertFileToDrive,
  createDriveFolderIfNotExists,
  findFile,
  getDriveforlderIdIfExists,
} from "@/lib/google-drive";
import { USER_FOLDER_NAME, USER_FILE_NAME } from "@/constants";

export async function saveUserData<T>(
  data: T,
  accessToken: string
): Promise<void> {
  try {
    // Convert data to JSON string
    const jsonContent = JSON.stringify(data, null, 2);

    // Create file object
    const file = new File([jsonContent], USER_FILE_NAME, {
      type: "application/json",
    });

    // Get or create user folder
    const folderId = await createDriveFolderIfNotExists(
      USER_FOLDER_NAME,
      accessToken
    );
    if (!folderId) {
      throw new Error("User folder not found");
    }

    // Upload/Update file
    await upsertFileToDrive(file, accessToken, folderId);
  } catch (error) {
    console.error("Error saving user data:", error);
    throw new Error("Failed to save user data to Google Drive");
  }
}

export async function getUserData<T>(accessToken: string): Promise<T | null> {
  try {
    // Find user folder
    const folderId = await getDriveforlderIdIfExists(
      USER_FOLDER_NAME,
      accessToken
    );
    if (!folderId) {
      return null;
    }

    // Find data file
    const fileId = await findFile(USER_FILE_NAME, folderId, accessToken);
    if (!fileId) {
      return null;
    }

    // Download file content
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to download user data from Google Drive");
    }

    const jsonContent = await response.text();

    return JSON.parse(jsonContent) as T;
  } catch (error) {
    console.error("Error loading user data:", error);
    throw new Error("Failed to load user data from Google Drive");
  }
}
