import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PARTAKE_API_URL = "https://api.partake.gg/";

const teamQuery = `
  query FindTeams($query: String!) {
    search(query: $query, offset: 0) {
      teams {
        results {
          team {
            id
            name
            handle
            iconUrl
          }
        }
      }
    }
  }
`;

const eventsQuery = `
  query UpcomingEvents($teamId: Int!, $start: DateTime!, $offset: Int!, $limit: Int!) {
    events(
      teamId: $teamId
      endsBetween: { start: $start }
      sortBy: STARTS_AT_ASC
      offset: $offset
      limit: $limit
    ) {
      id
      title
      startsAt
      endsAt
      location
      attachmentIds
      game {
        name
      }
      locationData {
        server {
          name
        }
      }
    }
  }
`;

type PartakeTeam = {
  id: number;
  name: string;
  handle: string | null;
  iconUrl: string | null;
};

type TeamSearchResponse = {
  search: {
    teams: {
      results: Array<{ team: PartakeTeam }>;
    };
  };
};

type EventsResponse = {
  events: Array<{
    id: number;
    title: string;
    startsAt: string;
    endsAt: string;
    location: string | null;
    attachmentIds: string[];
    game: { name: string } | null;
    locationData: { server: { name: string } | null } | null;
  }>;
};

async function requestPartake<T>(query: string, variables: Record<string, unknown>) {
  const response = await fetch(PARTAKE_API_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Partake request failed (${response.status}).`);
  }

  const body = (await response.json()) as {
    data?: T;
    errors?: Array<{ message?: string }>;
  };

  if (body.errors?.length) {
    throw new Error(body.errors[0].message ?? "Partake returned an API error.");
  }

  if (!body.data) {
    throw new Error("Partake did not return event data.");
  }

  return body.data;
}

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("team")?.trim().slice(0, 100) ?? "";
  const limitParam = request.nextUrl.searchParams.get("limit");
  const includeAll = limitParam === "all";
  const requestedLimit = Number(limitParam);
  const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 8) : 4;

  if (!name) {
    return NextResponse.json({ error: "Enter a Partake team name." }, { status: 400 });
  }

  try {
    const search = await requestPartake<TeamSearchResponse>(teamQuery, { query: name });
    const matches = search.search.teams.results.map((result) => result.team);
    const exact = matches.find((team) => team.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    const team = exact ?? matches[0];

    if (!team) {
      return NextResponse.json({ error: "No Partake team matched that name." }, { status: 404 });
    }

    const events: EventsResponse["events"] = [];
    const pageSize = includeAll ? 20 : limit;
    const start = new Date().toISOString();

    do {
      const upcoming = await requestPartake<EventsResponse>(eventsQuery, {
        teamId: team.id,
        start,
        offset: events.length,
        limit: pageSize,
      });
      events.push(...upcoming.events);

      if (!includeAll || upcoming.events.length < pageSize) break;
    } while (events.length < 100);

    return NextResponse.json({ team, events: includeAll ? events.slice(0, 100) : events });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to reach Partake." },
      { status: 502 },
    );
  }
}
