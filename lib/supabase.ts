import "server-only";

export type LetterEvent = {
  event_name: string;
  session_id: string;
  created_at: string;
};

export function supabaseFetch(path: string, init?: RequestInit) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured");

  return fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      ...init?.headers,
    },
    cache: "no-store",
  });
}
