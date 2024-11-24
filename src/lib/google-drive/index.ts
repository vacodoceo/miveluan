import { GoogleDriveFile } from "@/components/google-drive";

export async function uploadFileToDrive(
  file: File,
  accessToken: string,
  folderId?: string
): Promise<GoogleDriveFile> {
  const metadata = {
    name: file.name,
    mimeType: file.type,
    parents: folderId ? [folderId] : undefined,
  };

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  form.append("file", file);

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to upload file to Google Drive");
  }

  return await response.json();
}

export async function findFile(
  fileName: string,
  folderId: string | undefined,
  accessToken: string
): Promise<string | null> {
  const query = folderId
    ? `name='${fileName}' and '${folderId}' in parents and trashed=false`
    : `name='${fileName}' and trashed=false`;

  const searchResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!searchResponse.ok) {
    throw new Error("Failed to search for file in Google Drive");
  }

  const searchResult = await searchResponse.json();
  return searchResult.files?.length > 0 ? searchResult.files[0].id : null;
}

export async function upsertFileToDrive(
  file: File,
  accessToken: string,
  folderId?: string
): Promise<GoogleDriveFile> {
  // Try to find existing file
  const existingFileId = folderId
    ? await findFile(file.name, folderId, accessToken)
    : null;

  const metadata = {
    name: file.name,
    mimeType: file.type,
    ...(folderId && !existingFileId ? { parents: [folderId] } : {}),
  };

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  form.append("file", file);

  const url = existingFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
    : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

  const response = await fetch(url, {
    method: existingFileId ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to ${existingFileId ? "update" : "create"} file in Google Drive`
    );
  }

  return await response.json();
}

async function findFolder(
  folderName: string,
  parentId: string | undefined,
  accessToken: string
): Promise<string | null> {
  const query = parentId
    ? `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
    : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const searchResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!searchResponse.ok) {
    throw new Error("Failed to search for folder in Google Drive");
  }

  const searchResult = await searchResponse.json();
  return searchResult.files?.length > 0 ? searchResult.files[0].id : null;
}

async function createFolder(
  folderName: string,
  parentId: string | undefined,
  accessToken: string
): Promise<string> {
  const metadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
    parents: parentId ? [parentId] : undefined,
  };

  const createResponse = await fetch(
    "https://www.googleapis.com/drive/v3/files",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!createResponse.ok) {
    throw new Error("Failed to create folder in Google Drive");
  }

  const data = await createResponse.json();
  return data.id;
}

export const getDriveforlderIdIfExists = async (
  folderPath: string,
  accessToken: string
): Promise<string | null> => {
  const folders = folderPath.split("/").filter(Boolean);
  let parentId: string | undefined = undefined;

  for (const folderName of folders) {
    // Try to find existing folder
    const existingFolderId = await findFolder(
      folderName,
      parentId,
      accessToken
    );

    if (!existingFolderId) {
      // If any folder in the path doesn't exist, return null
      return null;
    }

    // Folder exists, use it as parent for next iteration
    parentId = existingFolderId;
  }

  return parentId || null;
};

export async function createDriveFolderIfNotExists(
  folderPath: string,
  accessToken: string
): Promise<string> {
  const folders = folderPath.split("/").filter(Boolean);
  let parentId: string | undefined = undefined;

  for (const folderName of folders) {
    // Try to find existing folder
    const existingFolderId = await findFolder(
      folderName,
      parentId,
      accessToken
    );

    if (existingFolderId) {
      // Folder exists, use it as parent for next iteration
      parentId = existingFolderId;
    } else {
      // Folder doesn't exist, create it
      parentId = await createFolder(folderName, parentId, accessToken);
    }
  }

  if (!parentId) {
    throw new Error("Failed to create or find folder structure");
  }

  return parentId;
}
