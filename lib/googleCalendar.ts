import type { CalendarImportEvent } from "@/types";

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

/**
 * Fetches events from the user's primary Google Calendar between now and `daysAhead` days from now.
 * Requires an OAuth access token carrying the calendar.readonly scope, obtained client-side via
 * Firebase's GoogleAuthProvider and forwarded to this server route per-request.
 */
export async function fetchUpcomingCalendarEvents(
  accessToken: string,
  daysAhead: number = 14
): Promise<CalendarImportEvent[]> {
  const now = new Date();
  const timeMax = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.set("timeMin", now.toISOString());
  url.searchParams.set("timeMax", timeMax.toISOString());
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "50");

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Calendar API error (${response.status}): ${body}`);
  }

  const data = (await response.json()) as { items?: GoogleCalendarEvent[] };

  return (data.items ?? [])
    .filter((event) => event.start?.dateTime || event.start?.date)
    .map((event) => ({
      externalId: event.id,
      title: event.summary ?? "Untitled calendar event",
      start: event.start?.dateTime ?? event.start?.date ?? now.toISOString(),
      end: event.end?.dateTime ?? event.end?.date ?? now.toISOString(),
      description: event.description,
    }));
}
