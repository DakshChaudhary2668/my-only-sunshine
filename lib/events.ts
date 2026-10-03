export const EVENTS = [
  "human_visit",
  "letter_opened",
  "slideshow_viewed",
  "music_played",
  "letter_finished",
] as const;

export type EventName = (typeof EVENTS)[number];

export function isEventName(value: unknown): value is EventName {
  return typeof value === "string" && EVENTS.includes(value as EventName);
}
