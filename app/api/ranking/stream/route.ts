import { getCrowdLeaderboard } from "@/lib/peer-voting/service";
import { isRankingFinalized } from "@/lib/scoring/finalization";
import { rankingEmitter, RANKING_UPDATED } from "@/lib/scoring/events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          cleanup();
        }
      };

      const pushRanking = async () => {
        try {
          const finalized = await isRankingFinalized();
          if (!finalized) {
            send(JSON.stringify({ leaderboard: [], finalized: false }));
            return;
          }
          const leaderboard = await getCrowdLeaderboard();
          send(JSON.stringify({ leaderboard, finalized: true }));
        } catch {
          send(JSON.stringify({ error: "Failed to load ranking" }));
        }
      };

      void pushRanking();

      const onUpdate = () => void pushRanking();
      rankingEmitter.on(RANKING_UPDATED, onUpdate);

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          cleanup();
        }
      }, 15_000);

      function cleanup() {
        rankingEmitter.off(RANKING_UPDATED, onUpdate);
        clearInterval(heartbeat);
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
