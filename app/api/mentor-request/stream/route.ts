import { requireSessionUser } from "@/lib/auth/session";
import { mentorEmitter, teamMentorChannel } from "@/lib/mentor/events";
import { getActiveRequestForTeam } from "@/lib/mentor/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  let actor;
  try {
    actor = await requireSessionUser(request);
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!actor.teamId) {
    return new Response("No team", { status: 400 });
  }

  const teamId = actor.teamId;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          cleanup();
        }
      };

      void getActiveRequestForTeam(teamId).then((req) => {
        send({ type: "init", request: req });
      });

      const onUpdate = (payload: object) => send(payload);
      const channel = teamMentorChannel(teamId);
      mentorEmitter.on(channel, onUpdate);

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          cleanup();
        }
      }, 15_000);

      function cleanup() {
        mentorEmitter.off(channel, onUpdate);
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
