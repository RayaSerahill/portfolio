"use client";

import Image from "next/image";
import Link from "next/link";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import modsList from "../mods/assets/modsList.json";
import styles from "./portfolio.module.css";


type PortfolioItem = {
  title: string;
  description: string;
  image: string;
  fullImage?: string;
  alt: string;
  link?: string;
  tags?: string[];
};

type LayoutMode = "feed" | "grid";
type SortMode = "default" | "name" | "downloadable" | "private";

const items = modsList as PortfolioItem[];

const accents = ["#f78ab5", "#e98ad9", "#ff9f7a", "#9ec7ff", "#9eddc6"] as const;
const layoutImageSizes = "(max-width: 720px) 100vw, (max-width: 920px) 50vw, 220px";

const tagClasses: Record<string, string> = {
  accessory: styles.tagAccessory,
  animation: styles.tagAnimation,
  blouse: styles.tagGear,
  collection: styles.tagAccessory,
  collar: styles.tagAccessory,
  couples: styles.tagAnimation,
  ears: styles.tagAccessory,
  eternity: styles.tagAccessory,
  face: styles.tagAccessory,
  female: styles.tagFemale,
  galaxy: styles.tagVfx,
  gear: styles.tagGear,
  lips: styles.tagAccessory,
  mask: styles.tagVfx,
  marie: styles.tagFemale,
  piercing: styles.tagAccessory,
  pose: styles.tagAnimation,
  pride: styles.tagPride,
  shy: styles.tagAnimation,
  sitting: styles.tagAnimation,
  standing: styles.tagAnimation,
  stars: styles.tagVfx,
  top: styles.tagGear,
  unisex: styles.tagFemale,
  vanilla: styles.tagAccessory,
  viera: styles.tagFemale,
};

const icon = {
  download: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  ),
  lock: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  ),
};

function itemId(item: PortfolioItem) {
  return item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function tagClass(tag: string) {
  return tagClasses[tag.toLowerCase()] ?? "";
}

function TopNav({ status }: { status: string | null }) {
  return (
    <div className={styles.topnav}>
      <span className={styles.pill} aria-label="Discord status">
        <span className={`${styles.dot} ${status ? styles[`status${status}` as keyof typeof styles] ?? "" : ""}`} />
        <span>I&apos;m currently {status ?? "around"}</span>
      </span>
      <div className={styles.navLinks}>
        <Link className={styles.pill} href="/" aria-label="Back to home">
          <span aria-hidden>♡</span>
          <span>Home</span>
        </Link>
      </div>
    </div>
  );
}

function Hero({ count }: { count: number }) {
  return (
    <section className={styles.hero}>
      <div className={styles.figure} aria-hidden="true">
        <img src="/mods/gen.webp" alt="" fill sizes="(max-width: 720px) 100vw, 360px" className={styles.heroImage} priority />
      </div>
      <div>
        <h1 className={styles.title}>Portfolio</h1>
        <p className={styles.lead}>
          A little gallery of FFXIV mods, animations, accessories, and visual experiments I&apos;ve made. Mostly cute, random, commissioned things.
        </p>
        <p className={styles.lead}>
          Public releases link out to their download pages, while private or unreleased pieces are shown as a small archive of work.
        </p>
      </div>
    </section>
  );
}

function Stats({ mods }: { mods: PortfolioItem[] }) {
  const total = mods.length;
  const free = mods.filter((item) => item.link).length;
  const privateCount = total - free;
  const tagCount = new Set(mods.flatMap((item) => item.tags ?? [])).size;

  return (
    <div className={styles.stats} aria-label="Portfolio summary">
      <div className={styles.stat}><b>{total}</b> pieces total</div>
      <div className={styles.stat}><b>{free}</b> public links</div>
      <div className={styles.stat}><b>{privateCount}</b> archive pieces</div>
    </div>
  );
}

function Filters({ tags, active, setActive, counts }: { tags: string[]; active: string; setActive: (tag: string) => void; counts: Record<string, number> }) {
  return (
    <div className={styles.filters} role="toolbar" aria-label="Filter by tag">
      <span className={styles.label}>filter ↳</span>
      <button type="button" className={styles.chip} aria-pressed={active === "all"} onClick={() => setActive("all")}>
        all <span className={styles.count}>({counts.all})</span>
      </button>
      {tags.map((tag) => (
        <button key={tag} type="button" className={styles.chip} aria-pressed={active === tag} onClick={() => setActive(tag)}>
          {tag} <span className={styles.count}>({counts[tag] || 0})</span>
        </button>
      ))}
    </div>
  );
}

function Controls({ layout, setLayout, sort, setSort, accent, setAccent }: { layout: LayoutMode; setLayout: (layout: LayoutMode) => void; sort: SortMode; setSort: (sort: SortMode) => void; accent: string; setAccent: (accent: string) => void }) {
  return (
    <div className={styles.controls} aria-label="Portfolio display controls">
      <div className={styles.controlGroup}>
        <span>layout</span>
        <button type="button" className={styles.miniChip} aria-pressed={layout === "feed"} onClick={() => setLayout("feed")}>feed</button>
        <button type="button" className={styles.miniChip} aria-pressed={layout === "grid"} onClick={() => setLayout("grid")}>grid</button>
      </div>
      <label className={styles.selectLabel}>
        sort
        <select className={styles.select} value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
          <option value="default">default</option>
          <option value="name">name A-Z</option>
          <option value="downloadable">public first</option>
          <option value="private">archive first</option>
        </select>
      </label>
      <div className={styles.controlGroup}>
        <span>accent</span>
        {accents.map((option) => (
          <button
            key={option}
            type="button"
            className={styles.swatch}
            aria-label={`Use accent ${option}`}
            aria-pressed={accent === option}
            style={{ backgroundColor: option }}
            onClick={() => setAccent(option)}
          />
        ))}
      </div>
    </div>
  );
}

function Card({ item }: { item: PortfolioItem }) {
  const tags = item.tags ?? [];
  const image = item.fullImage || item.image;

  return (
    <article className={styles.card} id={itemId(item)}>
      <div className={styles.thumb}>
        <Image src={image} alt={item.alt} fill sizes={layoutImageSizes} />
        {item.link ? <span className={styles.ribbon}>public</span> : <span className={styles.ribbon}>archive</span>}
      </div>
      <div className={styles.body}>
        <h3>{item.title}</h3>
        <div className={styles.meta}>
          {tags.map((tag) => (
            <span key={tag} className={`${styles.tag} ${tagClass(tag)}`}>{tag}</span>
          ))}
        </div>
        <p className={styles.desc}>{item.description}</p>
        <div className={styles.footerRow}>
          {item.link ? (
            <a className={styles.download} href={item.link} target="_blank" rel="noreferrer">
              {icon.download} open
            </a>
          ) : (
            <span className={styles.private}>{icon.lock} private or unreleased</span>
          )}
          <span className={styles.stamp}>♡ {tags[0] ?? "portfolio"}</span>
        </div>
      </div>
    </article>
  );
}

function Note() {
  return (
    <div className={styles.note}>
      <div className={styles.icon}>♡</div>
      <p>
        <b>A small note —</b> public pieces link to their release pages when available. Private, unfinished, or friend-only work is included for reference and portfolio fluff, not redistribution.
      </p>
    </div>
  );
}

export default function PortfolioPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [active, setActive] = useState("all");
  const [layout, setLayout] = useState<LayoutMode>("feed");
  const [sort, setSort] = useState<SortMode>("default");
  const [accent, setAccent] = useState<string>(accents[0]);

  useEffect(() => {
    let cancelled = false;

    async function getStatus() {
      try {
        const res = await fetch("https://api.lanyard.rest/v1/users/140137510952108033");
        const json = await res.json();
        const discordStatus = json?.data?.discord_status;
        if (!cancelled) setStatus(discordStatus === "dnd" ? "offline" : discordStatus ?? null);
      } catch {
        if (!cancelled) setStatus(null);
      }
    }

    getStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  const allTags = useMemo(() => [...new Set(items.flatMap((item) => item.tags ?? []))].sort((a, b) => a.localeCompare(b)), []);

  const counts = useMemo(() => {
    const values: Record<string, number> = { all: items.length };
    allTags.forEach((tag) => {
      values[tag] = items.filter((item) => item.tags?.includes(tag)).length;
    });
    return values;
  }, [allTags]);

  const filtered = useMemo(() => {
    const matching = active === "all" ? items : items.filter((item) => item.tags?.includes(active));

    if (sort === "name") return [...matching].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "downloadable") return [...matching].sort((a, b) => Number(Boolean(b.link)) - Number(Boolean(a.link)));
    if (sort === "private") return [...matching].sort((a, b) => Number(Boolean(a.link)) - Number(Boolean(b.link)));

    return matching;
  }, [active, sort]);

  const scopeStyle = { "--portfolio-accent": accent } as CSSProperties;

  return (
    <main className={styles.page} style={scopeStyle}>
      <div className={styles.shell}>
        <TopNav status={status} />
        <Hero count={items.length} />

        <h2 className={styles.sectionTitle}>The Archive</h2>
        <p className={styles.sectionSub}>↳ browse ✦ open · a soft cabinet of creative trinkets</p>

        <Stats mods={items} />

        <div className={`${styles.grid} ${layout === "feed" ? styles.feed : ""}`}>
          {filtered.map((item) => <Card key={item.title} item={item} />)}
        </div>

        {filtered.length === 0 ? <p className={styles.empty}>no pieces match this filter yet ♡</p> : null}

        <Note />

        <div className={styles.divider} />

        <p className={styles.commissionText}>
          ↳ looking for something specific? want a custom piece?<br />
          <Link href="/mods">browse the classic mods page</Link> · <Link href="/">return home</Link>
        </p>

        <footer className={styles.foot}>Personally made by me © 2026 Raya</footer>
      </div>
    </main>
  );
}
