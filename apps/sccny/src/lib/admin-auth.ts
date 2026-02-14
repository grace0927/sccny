import "server-only";
import { stackServerApp } from "@/stack/server";
import { NextResponse } from "next/server";

export async function getAdminUser() {
  const user = await stackServerApp.getUser();
  if (!user) return null;
  return user;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbiddenResponse() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
