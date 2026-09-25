import { google } from "googleapis";
import { Readable } from "stream";
import { getGoogleAuth } from "./google-auth";

function getDriveClient() {
  const auth = getGoogleAuth(["https://www.googleapis.com/auth/drive"]);
  return google.drive({ version: "v3", auth });
}

export async function uploadImageToDrive(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<{ fileId: string; url: string }> {
  const drive = getDriveClient();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  const fileMetadata: { name: string; parents?: string[] } = { name: fileName };
  if (folderId) {
    fileMetadata.parents = [folderId];
  }

  const media = {
    mimeType,
    body: Readable.from(fileBuffer),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id",
    supportsAllDrives: true,
  });

  const fileId = response.data.id!;

  // Make the file publicly readable
  await drive.permissions.create({
    fileId,
    supportsAllDrives: true,
    requestBody: {
      type: "anyone",
      role: "reader",
    },
  });

  return {
    fileId,
    url: `https://lh3.googleusercontent.com/d/${fileId}`,
  };
}

export interface DrivePresentation {
  id: string;
  name: string;
  createdTime: string; // ISO
  modifiedTime: string; // ISO
  webViewLink: string;
}

export async function listGeneratedPresentations(
  folderId: string
): Promise<DrivePresentation[]> {
  const drive = getDriveClient();
  const result = await drive.files.list({
    q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.presentation' and trashed=false`,
    fields: "files(id, name, createdTime, modifiedTime, webViewLink)",
    orderBy: "createdTime desc",
    pageSize: 100,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return (result.data.files ?? []).map((f) => ({
    id: f.id!,
    name: f.name ?? "",
    createdTime: f.createdTime ?? "",
    modifiedTime: f.modifiedTime ?? "",
    webViewLink:
      f.webViewLink ?? `https://docs.google.com/presentation/d/${f.id}/edit`,
  }));
}

export async function deleteFileFromDrive(fileId: string): Promise<void> {
  try {
    const drive = getDriveClient();
    await drive.files.delete({ fileId, supportsAllDrives: true });
  } catch (error) {
    // Log but don't throw — post deletion should proceed even if Drive cleanup fails
    console.error("Failed to delete Drive file:", fileId, error);
  }
}
