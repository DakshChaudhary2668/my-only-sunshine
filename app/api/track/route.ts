import { isEventName } from "@/lib/events";
import { supabaseFetch } from "@/lib/supabase";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return Response.json({ ok: false }, { status: 400 });

    const { event, sessionId } = body as Record<string, unknown>;
    if (!isEventName(event) || typeof sessionId !== "string" || !UUID.test(sessionId)) {
      return Response.json({ ok: false }, { status: 400 });
    }

    const response = await supabaseFetch("letter_events", {
      method: "POST",
      headers: { "content-type": "application/json", prefer: "return=minimal" },
      body: JSON.stringify({ event_name: event, session_id: sessionId }),
    });

    return Response.json({ ok: response.ok || response.status === 409 }, { status: response.ok || response.status === 409 ? 200 : 502 });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
