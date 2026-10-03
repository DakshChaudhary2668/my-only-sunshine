import type { EventName } from "./events";

const SESSION_KEY = "sunshine-session-id";

export function trackEvent(event: EventName) {
  if (typeof window === "undefined") return;

  try {
    const sentKey = `sunshine-event-${event}`;
    if (sessionStorage.getItem(sentKey)) return;

    let sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }

    sessionStorage.setItem(sentKey, "1");
    void fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event, sessionId }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Tracking must never interrupt the letter.
  }
}
