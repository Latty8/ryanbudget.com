import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth/read-session";
import { isDemoUserId } from "@/lib/auth/demo-mode";
import { hasCloudDataSync } from "@/lib/db/config";
import { getSyncRevision, isSyncAvailable } from "@/lib/db/sync-server";

/** SSE stream — notifies clients when cloud data revision changes (MongoDB updatedAt). */
export async function GET(request: Request) {
  const session = await readSession();
  if (!session?.userId || isDemoUserId(session.userId)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!hasCloudDataSync || !isSyncAvailable()) {
    return NextResponse.json({ ok: false, syncEnabled: false }, { status: 503 });
  }

  const userId = session.userId;
  let lastRevision = (await getSyncRevision(userId)) ?? "";
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (revision: string) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ revision })}\n\n`));
      };

      send(lastRevision);

      const interval = setInterval(async () => {
        if (closed) return;
        try {
          const revision = (await getSyncRevision(userId)) ?? "";
          if (revision && revision !== lastRevision) {
            lastRevision = revision;
            send(revision);
          }
        } catch {
          /* ignore transient errors */
        }
      }, 2_000);

      const keepAlive = setInterval(() => {
        if (closed) return;
        controller.enqueue(encoder.encode(": keepalive\n\n"));
      }, 25_000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(interval);
        clearInterval(keepAlive);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
