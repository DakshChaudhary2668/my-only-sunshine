import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EVENTS, type EventName } from "@/lib/events";
import { type LetterEvent, supabaseFetch } from "@/lib/supabase";
import styles from "./admin.module.css";

const COOKIE = "sunshine-admin";
const labels: Record<EventName, string> = {
  human_visit: "Human sessions",
  letter_opened: "Letter opens",
  slideshow_viewed: "Slideshows viewed",
  music_played: "Music plays",
  letter_finished: "Letter finishes",
};

function token() {
  const password = process.env.ADMIN_PASSWORD;
  return password ? createHmac("sha256", password).update("sunshine-admin").digest("hex") : "";
}

function equal(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function login(formData: FormData) {
  "use server";
  const password = process.env.ADMIN_PASSWORD;
  const supplied = formData.get("password");
  if (!password || typeof supplied !== "string" || !equal(supplied, password)) redirect("/admin?error=1");

  (await cookies()).set(COOKIE, token(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 60 * 60 * 8,
  });
  redirect("/admin");
}

async function logout() {
  "use server";
  (await cookies()).set(COOKIE, "", { expires: new Date(0), path: "/admin" });
  redirect("/admin");
}

async function count(event: EventName) {
  const response = await supabaseFetch(`letter_events?select=id&event_name=eq.${event}`, {
    headers: { prefer: "count=exact", range: "0-0" },
  });
  if (!response.ok) throw new Error("Unable to load analytics");
  return Number(response.headers.get("content-range")?.split("/")[1] ?? 0);
}

async function dashboardData() {
  const [counts, recentResponse] = await Promise.all([
    Promise.all(EVENTS.map(count)),
    supabaseFetch("letter_events?select=event_name,session_id,created_at&order=created_at.desc&limit=50"),
  ]);
  if (!recentResponse.ok) throw new Error("Unable to load analytics");
  return { counts, recent: await recentResponse.json() as LetterEvent[] };
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const expectedToken = token();
  const authenticated = Boolean(expectedToken) && equal((await cookies()).get(COOKIE)?.value ?? "", expectedToken);
  const { error } = await searchParams;

  if (!authenticated) {
    return (
      <main className={styles.login}>
        <form action={login} className={styles.loginCard}>
          <p className={styles.eyebrow}>Private dashboard</p>
          <h1>Sunshine activity</h1>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus />
          {error && <p className={styles.error}>Incorrect password.</p>}
          <button type="submit">Open dashboard</button>
        </form>
      </main>
    );
  }

  let data: Awaited<ReturnType<typeof dashboardData>> | null = null;
  try { data = await dashboardData(); } catch {}

  return (
    <main className={styles.dashboard}>
      <header>
        <div>
          <p className={styles.eyebrow}>Private dashboard</p>
          <h1>Sunshine activity</h1>
          <p>Anonymous interaction events only.</p>
        </div>
        <form action={logout}><button type="submit" className={styles.logout}>Log out</button></form>
      </header>

      {!data ? <p className={styles.notice}>Add the Supabase environment variables to load activity.</p> : (
        <>
          <section className={styles.summary} aria-label="Activity summary">
            {EVENTS.map((event, index) => (
              <article key={event}>
                <span>{labels[event]}</span>
                <strong>{data.counts[index]}</strong>
              </article>
            ))}
            <article>
              <span>Latest activity</span>
              <strong className={styles.date}>{data.recent[0] ? formatDate(data.recent[0].created_at) : "—"}</strong>
            </article>
          </section>

          <section className={styles.events}>
            <h2>Recent events</h2>
            <div className={styles.tableWrap}>
              <table>
                <thead><tr><th>Event</th><th>Session</th><th>Timestamp</th></tr></thead>
                <tbody>
                  {data.recent.map((event, index) => (
                    <tr key={`${event.session_id}-${event.event_name}-${index}`}>
                      <td>{event.event_name}</td>
                      <td><code>{event.session_id.slice(0, 4)}••••</code></td>
                      <td>{formatDate(event.created_at)}</td>
                    </tr>
                  ))}
                  {!data.recent.length && <tr><td colSpan={3}>No activity yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value));
}
