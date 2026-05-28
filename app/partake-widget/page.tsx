"use client";

import Image from "next/image";
import Link from "next/link";
import { CSSProperties, FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./portfolio.module.css";

type ViewMode = "next" | "feed";
type ThemeMode = "light" | "dark";
type Density = "compact" | "roomy";
type Corners = "soft" | "round" | "square";
type LoadState = "idle" | "loading" | "ready" | "error";
type EventLimit = number | "all";

type PartakeTeam = {
  id: number;
  name: string;
  handle: string | null;
  iconUrl: string | null;
};

type PartakeEvent = {
  id: number;
  title: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
  attachmentIds: string[];
  game: { name: string } | null;
  locationData: { server: { name: string } | null } | null;
};

type EventResponse = {
  team: PartakeTeam;
  events: PartakeEvent[];
};

type WidgetConfig = {
  view: ViewMode;
  theme: ThemeMode;
  density: Density;
  corners: Corners;
  accent: string;
  showImages: boolean;
  limit: EventLimit;
};

const accents = ["#ff6291", "#f78ab5", "#ae78df", "#5b9bd5", "#42b99c", "#ec8052"];

function paramChoice<T extends string>(value: string | null, options: readonly T[], fallback: T) {
  return options.includes(value as T) ? (value as T) : fallback;
}

function accentParam(value: string | null) {
  return value && /^[0-9a-fA-F]{6}$/.test(value) ? `#${value}` : accents[0];
}

function eventImage(event: PartakeEvent) {
  const attachment = event.attachmentIds[0];
  return attachment ? `https://cdn.partake.gg/assets/${attachment}` : null;
}

function eventDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function escapeAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function Widget({
  config,
  teamName,
  data,
  state,
  error,
}: {
  config: WidgetConfig;
  teamName: string;
  data: EventResponse | null;
  state: LoadState;
  error: string | null;
}) {
  const shownEvents = config.view === "next" ? data?.events.slice(0, 1) ?? [] : data?.events ?? [];
  const team = data?.team;

  return (
    <section
      className={[
        styles.widget,
        config.theme === "dark" ? styles.widgetDark : "",
        config.density === "compact" ? styles.widgetCompact : "",
        styles[`corners${config.corners[0].toUpperCase()}${config.corners.slice(1)}` as keyof typeof styles],
      ].join(" ")}
      style={{ "--widget-accent": config.accent } as CSSProperties}
      aria-busy={state === "loading"}
    >
      <header className={styles.widgetHeader}>
        <div className={styles.teamHeading}>
          {team?.iconUrl ? <Image src={team.iconUrl} alt="" width={38} height={38} className={styles.teamIcon} /> : null}
          <div>
            <p className={styles.widgetLabel}>{config.view === "next" ? "Next Event" : "Upcoming Events"}</p>
            <h2>{team?.name ?? (teamName || "Partake team")}</h2>
          </div>
        </div>
        {team ? (
          <a className={styles.partakeLink} href={`https://partake.gg/teams/${team.id}`} target="_blank" rel="noreferrer">
            View team
          </a>
        ) : null}
      </header>

      {state === "idle" ? <p className={styles.widgetMessage}>Enter a Partake team name to load events.</p> : null}
      {state === "loading" ? <p className={styles.widgetMessage}>Loading upcoming events...</p> : null}
      {state === "error" ? <p className={`${styles.widgetMessage} ${styles.widgetError}`}>{error}</p> : null}
      {state === "ready" && shownEvents.length === 0 ? <p className={styles.widgetMessage}>No upcoming events found.</p> : null}

      {shownEvents.length > 0 ? (
        <div className={`${styles.eventList} ${config.view === "next" ? styles.eventListNext : ""}`}>
          {shownEvents.map((event) => {
            const image = config.showImages ? eventImage(event) : null;
            return (
              <article className={`${styles.event} ${config.view === "next" ? styles.eventNext : ""}`} key={event.id}>
                {image ? (
                  <div className={styles.eventImage}>
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes={config.view === "next" ? "(max-width: 720px) 94vw, 680px" : "(max-width: 720px) 94vw, 420px"}
                    />
                  </div>
                ) : null}
                <div className={styles.eventBody}>
                  <a className={styles.eventTitle} href={`https://partake.gg/events/${event.id}`} target="_blank" rel="noreferrer">
                    {event.title}
                  </a>
                  <p className={styles.eventMeta}>{eventDate(event.startsAt)}</p>
                  {event.location ? (
                    <p className={styles.eventMeta}>
                      {event.locationData?.server?.name ? `${event.locationData.server.name} - ` : ""}
                      {event.location}
                    </p>
                  ) : null}
                  {event.game?.name ? <span className={styles.eventTag}>{event.game.name}</span> : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function PartakeWidgetPageContent() {
  const params = useSearchParams();
  const embedded = params.get("embed") === "1";
  const initialTeam = params.get("team")?.trim() ?? "";
  const [teamName, setTeamName] = useState(initialTeam);
  const [loadedTeamName, setLoadedTeamName] = useState(embedded ? initialTeam : "");
  const [view, setView] = useState<ViewMode>(() => paramChoice(params.get("view"), ["next", "feed"], "next"));
  const [theme, setTheme] = useState<ThemeMode>(() => paramChoice(params.get("theme"), ["light", "dark"], "light"));
  const [density, setDensity] = useState<Density>(() => paramChoice(params.get("density"), ["compact", "roomy"], "roomy"));
  const [corners, setCorners] = useState<Corners>(() => paramChoice(params.get("corners"), ["soft", "round", "square"], "soft"));
  const [accent, setAccent] = useState(() => accentParam(params.get("accent")));
  const [showImages, setShowImages] = useState(() => params.get("images") !== "0");
  const [limit, setLimit] = useState<EventLimit>(() => {
    const parameter = params.get("limit");
    if (parameter === "all") return "all";
    const requested = Number(parameter);
    return Number.isInteger(requested) && requested >= 2 && requested <= 8 ? requested : 4;
  });
  const [state, setState] = useState<LoadState>(loadedTeamName ? "loading" : "idle");
  const [data, setData] = useState<EventResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [reload, setReload] = useState(0);

  const config = useMemo<WidgetConfig>(
    () => ({ view, theme, density, corners, accent, showImages, limit }),
    [view, theme, density, corners, accent, showImages, limit],
  );

  useEffect(() => {
    if (!loadedTeamName) return;

    const controller = new AbortController();
    const eventLimit = view === "next" ? "1" : String(limit);

    fetch(`/api/partake/events?team=${encodeURIComponent(loadedTeamName)}&limit=${eventLimit}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) {
          throw new Error(typeof body.error === "string" ? body.error : "Unable to load this team.");
        }
        return body as EventResponse;
      })
      .then((body) => {
        setData(body);
        setState("ready");
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setData(null);
        setError(requestError instanceof Error ? requestError.message : "Unable to load events.");
        setState("error");
      });

    return () => controller.abort();
  }, [limit, loadedTeamName, reload, view]);

  function loadTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = teamName.trim();
    if (!value) {
      setLoadedTeamName("");
      setData(null);
      setError(null);
      setState("idle");
      return;
    }

    setData(null);
    setError(null);
    setState("loading");
    setLoadedTeamName(value);
    if (value === loadedTeamName) setReload((current) => current + 1);
  }

  const publishedTeam = data?.team.name ?? loadedTeamName;
  const embedParams = new URLSearchParams({
    embed: "1",
    team: publishedTeam,
    view,
    theme,
    density,
    corners,
    accent: accent.slice(1),
    images: showImages ? "1" : "0",
    limit: String(limit),
  });
  const embedUrl = `https://serahill.net/partake-widget?${embedParams.toString()}`;
  const nextEventEmbedHeight = showImages ? (density === "compact" ? 420 : 520) : 250;
  const feedEmbedHeight = limit === "all" ? 760 : Math.min(760, 130 + limit * (showImages ? 190 : 110));
  const embedHeight = view === "next" ? nextEventEmbedHeight : feedEmbedHeight;
  const embedCode = `<iframe src="${embedUrl}" title="${escapeAttribute(`Upcoming events from ${publishedTeam || "Partake"}`)}" width="100%" height="${embedHeight}" style="border:0;" loading="lazy"></iframe>`;

  async function copyEmbed() {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  if (embedded) {
    return (
      <main className={styles.embedPage}>
        <Widget config={config} teamName={loadedTeamName} data={data} state={state} error={error} />
      </main>
    );
  }

  return (
    <main className={styles.page} style={{ "--page-accent": accent } as CSSProperties}>
      <div className={styles.shell}>
        <nav className={styles.topnav}>
          <Link className={styles.pill} href="/">
            Home
          </Link>
          <a className={styles.pill} href="https://partake.gg/" target="_blank" rel="noreferrer">
            Partake
          </a>
        </nav>

        <header className={styles.hero}>
          <p className={styles.eyebrow}>Partake API widget</p>
          <h1 className={styles.title}>Upcoming Events</h1>
          <p className={styles.lead}>
            Enter a Partake team name, choose a single next event or an upcoming feed, then style and embed your widget.
          </p>
        </header>

        <div className={styles.workspace}>
          <form className={styles.panel} onSubmit={loadTeam}>
            <h2>Widget Settings</h2>

            <label className={styles.field}>
              <span>Team name</span>
              <div className={styles.inputRow}>
                <input
                  className={styles.textInput}
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                  placeholder="Partake team name"
                  required
                />
                <button className={styles.primaryButton} type="submit">
                  Load
                </button>
              </div>
            </label>

            <fieldset className={styles.fieldset}>
              <legend>Display</legend>
              <div className={styles.segmented}>
                <button type="button" aria-pressed={view === "next"} onClick={() => setView("next")}>
                  Next event
                </button>
                <button type="button" aria-pressed={view === "feed"} onClick={() => setView("feed")}>
                  Event feed
                </button>
              </div>
            </fieldset>

            {view === "feed" ? (
              <label className={styles.field}>
                <span>Events shown</span>
                <select
                  className={styles.select}
                  value={String(limit)}
                  onChange={(event) => setLimit(event.target.value === "all" ? "all" : Number(event.target.value))}
                >
                  {[2, 3, 4, 5, 6, 8].map((count) => (
                    <option key={count} value={count}>
                      {count} events
                    </option>
                  ))}
                  <option value="all">All upcoming</option>
                </select>
              </label>
            ) : null}

            <fieldset className={styles.fieldset}>
              <legend>Theme</legend>
              <div className={styles.segmented}>
                <button type="button" aria-pressed={theme === "light"} onClick={() => setTheme("light")}>
                  Light
                </button>
                <button type="button" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>
                  Dark
                </button>
              </div>
            </fieldset>

            <fieldset className={styles.fieldset}>
              <legend>Accent</legend>
              <div className={styles.swatches}>
                {accents.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={styles.swatch}
                    aria-label={`Use accent ${color}`}
                    aria-pressed={accent === color}
                    style={{ backgroundColor: color }}
                    onClick={() => setAccent(color)}
                  />
                ))}
                <input className={styles.colorInput} type="color" value={accent} aria-label="Custom accent color" onChange={(event) => setAccent(event.target.value)} />
              </div>
            </fieldset>

            <div className={styles.twoColumns}>
              <label className={styles.field}>
                <span>Corners</span>
                <select className={styles.select} value={corners} onChange={(event) => setCorners(event.target.value as Corners)}>
                  <option value="soft">Soft</option>
                  <option value="round">Round</option>
                  <option value="square">Square</option>
                </select>
              </label>
              <label className={styles.field}>
                <span>Spacing</span>
                <select className={styles.select} value={density} onChange={(event) => setDensity(event.target.value as Density)}>
                  <option value="roomy">Roomy</option>
                  <option value="compact">Compact</option>
                </select>
              </label>
            </div>

            <label className={styles.checkbox}>
              <input type="checkbox" checked={showImages} onChange={(event) => setShowImages(event.target.checked)} />
              Show event images
            </label>
          </form>

          <section className={styles.preview}>
            <div className={styles.previewHeading}>
              <h2>Preview</h2>
              <span>Live data from Partake</span>
            </div>
            <Widget config={config} teamName={loadedTeamName} data={data} state={state} error={error} />
          </section>
        </div>

        <section className={styles.embedPanel}>
          <div className={styles.embedHeading}>
            <div>
              <h2>Embed Code</h2>
              <p>The embedded widget is rendered here and retrieves event data from Partake&apos;s public API.</p>
            </div>
            <button className={styles.primaryButton} type="button" onClick={copyEmbed} disabled={!publishedTeam}>
              {copied ? "Copied" : "Copy iframe"}
            </button>
          </div>
          <pre className={styles.code}><code>{publishedTeam ? embedCode : "Load a team to generate embed code."}</code></pre>
        </section>

        <footer className={styles.footer}>
          Event data provided by{" "}
          <a href="https://partake.gg/" target="_blank" rel="noreferrer">
            Partake
          </a>
          .
        </footer>
      </div>
    </main>
  );
}

export default function PartakeWidgetPage() {
  return (
    <Suspense fallback={<main className={styles.embedPage}><p className={styles.widgetMessage}>Loading...</p></main>}>
      <PartakeWidgetPageContent />
    </Suspense>
  );
}
