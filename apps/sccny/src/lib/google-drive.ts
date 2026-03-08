import { google } from "googleapis";
import { Readable } from "stream";
import fs from "fs";

function getDriveClient() {
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!credentialsJson && !credentialsPath) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_CREDENTIALS is not configured");
  }

  const credentials = credentialsJson
    ? JSON.parse(credentialsJson)
    : JSON.parse(fs.readFileSync(credentialsPath!, "utf-8"));

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

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

export async function deleteFileFromDrive(fileId: string): Promise<void> {
  try {
    const drive = getDriveClient();
    await drive.files.delete({ fileId, supportsAllDrives: true });
  } catch (error) {
    // Log but don't throw — post deletion should proceed even if Drive cleanup fails
    console.error("Failed to delete Drive file:", fileId, error);
  }
}
