import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Verify session exists
  const session = await prisma.translationSession.findUnique({ where: { id } });
  if (!session) {
    return new Response("Session not found", { status: 404 });
  }

  const encoder = new TextEncoder();
  let lastEntryId: string | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial entries
      const entries = await prisma.translationEntry.findMany({
        where: { sessionId: id },
        orderBy: { createdAt: "asc" },
      });

      if (entries.length > 0) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "initial", entries })}\n\n`)
        );
        lastEntryId = entries[entries.length - 1].id;
      } else {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "initial", entries: [] })}\n\n`)
        );
      }

      // Poll for new entries every 1 second
      const interval = setInterval(async () => {
        try {
          // Check if session is still active
          const currentSession = await prisma.translationSession.findUnique({
            where: { id },
          });
          if (!currentSession || currentSession.status === "ENDED") {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "ended" })}\n\n`)
            );
            clearInterval(interval);
            controller.close();
            return;
          }

          const where: Record<string, unknown> = { sessionId: id };
          if (lastEntryId) {
            // Get entries created after the last one we sent
            const lastEntry = await prisma.translationEntry.findUnique({
              where: { id: lastEntryId },
            });
            if (lastEntry) {
              where.createdAt = { gt: lastEntry.createdAt };
            }
          }

          const newEntries = await prisma.translationEntry.findMany({
            where,
            orderBy: { createdAt: "asc" },
          });

          if (newEntries.length > 0) {
            for (const entry of newEntries) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "entry", entry })}\n\n`)
              );
            }
            lastEntryId = newEntries[newEntries.length - 1].id;
          }

          // Heartbeat
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          // Connection may be closed
          clearInterval(interval);
        }
      }, 1000);

      // Clean up on abort
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // Controller may already be closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
