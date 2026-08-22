import "server-only";
import { google } from "googleapis";
import fs from "fs";

/**
 * Shared service-account auth for every Google API this app talks to.
 *
 * Credentials come from either `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` (raw JSON,
 * how Vercel supplies it) or `GOOGLE_APPLICATION_CREDENTIALS` (a path, how a
 * local checkout usually supplies it).
 *
 * `subject` enables domain-wide delegation: the service account acts *as* that
 * Workspace user. Gmail needs this — a service account has no mailbox of its
 * own — and it only works if a Workspace super admin has granted the service
 * account's client ID the requested scopes in
 * Admin console → Security → API controls → Domain-wide delegation.
 * Without that grant Google rejects the token request with `unauthorized_client`.
 */
export function getGoogleAuth(scopes: string[], subject?: string) {
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!credentialsJson && !credentialsPath) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_CREDENTIALS is not configured");
  }

  const credentials = credentialsJson
    ? JSON.parse(credentialsJson)
    : JSON.parse(fs.readFileSync(credentialsPath!, "utf-8"));

  return new google.auth.GoogleAuth({
    credentials,
    scopes,
    ...(subject ? { clientOptions: { subject } } : {}),
  });
}
