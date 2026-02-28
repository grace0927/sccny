import { google } from "googleapis";
import { Readable } from "stream";

function getDriveClient() {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
  if (!credentials) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_CREDENTIALS is not configured");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(credentials),
    scopes: ["https://www.googleapis.com/auth/drive.file"],
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
  });

  const fileId = response.data.id!;

  // Make the file publicly readable
  await drive.permissions.create({
    fileId,
    requestBody: {
      type: "anyone",
      role: "reader",
    },
  });

  return {
    fileId,
    url: `https://drive.google.com/uc?id=${fileId}`,
  };
}

export async function deleteFileFromDrive(fileId: string): Promise<void> {
  try {
    const drive = getDriveClient();
    await drive.files.delete({ fileId });
  } catch (error) {
    // Log but don't throw — post deletion should proceed even if Drive cleanup fails
    console.error("Failed to delete Drive file:", fileId, error);
  }
}
