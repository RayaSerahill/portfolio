import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Blocks,
  Box,
  Code2,
  ExternalLink,
  Flower2,
  Github,
  Globe2,
  Heart,
  PackageOpen,
  ShieldCheck,
  Sparkles,
  Sun,
  Wrench,
} from "lucide-react";
import { FestivalSky } from "./FestivalSky";
import styles from "./festival.module.css";

const services = [
  {
    icon: Globe2,
    number: "01",
    title: "Websites & web apps",
    description:
      "A polished responsive site, a useful dashboard, or a small web product shaped around your idea and the people who will use it.",
    details: "Frontend · APIs · databases · deployment-ready builds",
    color: "coral",
  },
  {
    icon: Blocks,
    number: "02",
    title: "FFXIV plugins",
    description:
      "A Dalamud plugin that surfaces useful data, smooths out a workflow, or adds a delightfully specific experience to your game.",
    details: "Dalamud · C# · configuration · integrations",
    color: "aqua",
  },
  {
    icon: Wrench,
    number: "03",
    title: "Tools & odd ideas",
    description:
      "A desktop utility, workflow helper, or hard-to-categorize little invention taken from rough sketch to something you can use.",
    details: "Desktop apps · prototypes · bespoke utilities",
    color: "yellow",
  },
] as const;

const projects = [
  {
    title: "Better Discord Rich Presence",
    eyebrow: "Dalamud plugin",
    href: "https://github.com/RayaSerahill/BetterDiscordRichpresence",
    image: "/img/bdrp.png",
    imageAlt: "Better Discord Rich Presence logo",
    description:
      "Shares your FFXIV character, world, location, and party status through Discord Rich Presence, with automatic updates and customizable links.",
    tone: "pink",
  },
  {
    title: "SimpleStats",
    eyebrow: "Dalamud plugin",
    href: "https://github.com/RayaSerahill/SimpleStats",
    image: "/img/simplestats.png",
    imageAlt: "SimpleStats logo",
    description:
      "Captures live and archived stats from SimpleGamba plugins and uploads them securely, with API-key configuration and manual upload controls.",
    tone: "green",
  },
  {
    title: "sbjStats Web",
    eyebrow: "Next.js platform",
    href: "https://github.com/RayaSerahill/sbjStats-Web",
    image: "/img/stats.png",
    imageAlt: "Blackjack dealer statistics page preview",
    description:
      "The React and TypeScript web platform on the other side of the stats pipeline, built to receive game data and present it on public player pages.",
    tone: "blue",
  },
] as const;

export default function EorzeanFestivalPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="#top" aria-label="Back to the top">
          <Flower2 aria-hidden="true" size={18} />
          <span>Raya at Eorzea</span>
        </a>
        <nav className={styles.nav} aria-label="Festival page navigation">
          <a href="#offering">The offering</a>
          <a href="#work">Recent work</a>
          <a
            className={styles.githubNav}
            href="https://github.com/RayaSerahill"
            target="_blank"
            rel="noreferrer"
          >
            <Github aria-hidden="true" size={17} />
            <span>GitHub</span>
          </a>
        </nav>
      </header>

      <section className={styles.hero} id="top">
        <FestivalSky />
        <div className={styles.bunting} aria-hidden="true">
          {Array.from({ length: 14 }, (_, index) => (
            <span key={index} />
          ))}
        </div>

        <Flower2 className={styles.flowerOne} aria-hidden="true" />

        <Image
          className={styles.heroArtwork}
          src="/img/color_nobg.webp"
          alt="Illustration of Raya Serahill surrounded by flowers"
          fill
          priority
          sizes="(max-width: 760px) 100vw, 58vw"
        />

        <div className={styles.heroInner}>
          <p className={styles.eventLabel}>
            <Sun aria-hidden="true" size={17} />
            Eorzean Summer Festival · Developer Auction
          </p>
          <h1>
            Raya
            <span>Serahill</span>
          </h1>
          <p className={styles.heroKicker}>Your idea, made real.</p>
          <p className={styles.heroCopy}>
            Bid for a development commission and bring me the project you keep
            wishing existed. Websites, FFXIV plugins, custom tools: if it can be
            built, I want to hear about it.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryButton} href="#offering">
              See what I&apos;m offering
              <ArrowDown aria-hidden="true" size={18} />
            </a>
            <a className={styles.textLink} href="#work">
              Browse recent work
              <ArrowRight aria-hidden="true" size={18} />
            </a>
          </div>
          <p className={styles.heroNote}>
            <Heart aria-hidden="true" size={16} fill="currentColor" />
            One winning bid, one thoughtfully scoped build.
          </p>
        </div>
      </section>

      <section className={styles.offering} id="offering">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>What you&apos;re bidding on</p>
            <h2>A developer for your very specific idea</h2>
            <p>
              You&apos;re bidding on my time and development experience, not a
              mystery box. Bring the spark and we&apos;ll shape a practical scope
              together before I start building.
            </p>
          </div>

          <div className={styles.serviceGrid}>
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <article
                  className={`${styles.serviceCard} ${styles[service.color]}`}
                  key={service.title}
                >
                  <div className={styles.serviceTopline}>
                    <span className={styles.serviceIcon}>
                      <Icon aria-hidden="true" size={24} />
                    </span>
                    <span className={styles.serviceNumber}>{service.number}</span>
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <span className={styles.serviceDetails}>{service.details}</span>
                </article>
              );
            })}
          </div>

          <div className={styles.processStrip}>
            <div>
              <span>Bring</span>
              <p>Your concept, problem, or delightfully niche wish.</p>
            </div>
            <ArrowRight aria-hidden="true" />
            <div>
              <span>Shape</span>
              <p>We agree on a focused project that fits the winning bid.</p>
            </div>
            <ArrowRight aria-hidden="true" />
            <div>
              <span>Build</span>
              <p>I turn the plan into a working, handover-ready result.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.work} id="work">
        <div className={styles.sectionInner}>
          <div className={styles.workHeading}>
            <div>
              <p className={styles.eyebrow}>Recent work</p>
              <h2>Proof I like a big idea</h2>
            </div>
            <p>
              From native desktop tooling to tiny game integrations and the web
              services behind them, I build across the whole stack.
            </p>
          </div>

          <article className={styles.moonlaceFeature}>
            <div className={styles.moonlaceVisual}>
              <div className={styles.featureRibbon}>
                <Sparkles aria-hidden="true" size={16} />
                Featured project
              </div>
              <Image
                src="/eorzean-festival/moonlace.png"
                alt="Moonlace showing a searchable FFXIV gear browser, model editing controls, and a 3D garment preview"
                width={1400}
                height={900}
                sizes="(max-width: 900px) 100vw, 60vw"
              />
            </div>
            <div className={styles.moonlaceCopy}>
              <div className={styles.moonlaceTitleRow}>
                <span className={styles.moonIcon} aria-hidden="true">☾</span>
                <div>
                  <p>Native FFXIV modding workbench</p>
                  <h3>Moonlace</h3>
                </div>
              </div>
              <p className={styles.moonlaceLead}>
                A Linux-first desktop app for browsing, previewing, and editing
                FFXIV models and Penumbra mods, now available on Linux and Windows.
              </p>
              <ul className={styles.featureList}>
                <li>
                  <Box aria-hidden="true" size={19} />
                  Search around 29,000 gear pieces, accessories, and body models,
                  then preview them fully textured in 3D.
                </li>
                <li>
                  <PackageOpen aria-hidden="true" size={19} />
                  Round-trip GLTF or FBX through Blender, edit materials and
                  textures live, and export the result as a Penumbra mod.
                </li>
                <li>
                  <ShieldCheck aria-hidden="true" size={19} />
                  Upgrade older TTMP and PMP packs while keeping the actual game
                  installation strictly read-only.
                </li>
              </ul>
              <div className={styles.tagRow} aria-label="Moonlace highlights">
                <span>Desktop app</span>
                <span>Linux + Windows</span>
                <span>3D tooling</span>
              </div>
              <a
                className={styles.repoButton}
                href="https://github.com/RayaSerahill/Moonlace"
                target="_blank"
                rel="noreferrer"
              >
                Explore Moonlace
                <ExternalLink aria-hidden="true" size={17} />
              </a>
            </div>
          </article>

          <div className={styles.projectGrid}>
            {projects.map((project) => (
              <article
                className={`${styles.projectCard} ${styles[project.tone]}`}
                key={project.title}
              >
                <div className={styles.projectImage}>
                  <Image
                    src={project.image}
                    alt={project.imageAlt}
                    fill
                    sizes="(max-width: 760px) 100vw, 33vw"
                  />
                </div>
                <div className={styles.projectBody}>
                  <p className={styles.projectType}>{project.eyebrow}</p>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <a href={project.href} target="_blank" rel="noreferrer">
                    View repository
                    <ExternalLink aria-hidden="true" size={16} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.closing}>
        <Flower2 className={styles.closingFlower} aria-hidden="true" />
        <div className={styles.closingInner}>
          <div className={styles.closingCopy}>
            <p className={styles.eyebrow}>See you at the festival</p>
            <h2>Bring me your weirdly specific idea.</h2>
            <p>
              Find Raya at the Eorzean Summer Festival, tell me what you want to
              make, and place your bid. Cute is welcome. Useful is welcome. Both
              at once is even better.
            </p>
            <div className={styles.closingActions}>
              <a
                className={styles.darkButton}
                href="mailto:rayaserahill@gmail.com"
              >
                <Code2 aria-hidden="true" size={18} />
                Talk project with me
              </a>
              <a
                className={styles.closingLink}
                href="https://github.com/RayaSerahill"
                target="_blank"
                rel="noreferrer"
              >
                <Github aria-hidden="true" size={18} />
                RayaSerahill
              </a>
            </div>
          </div>
          <div className={styles.closingPortrait}>
            <Image
              src="/img/sitting.png"
              alt="Raya sitting with a flower-decorated tail"
              fill
              sizes="(max-width: 760px) 80vw, 38vw"
            />
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>Made by Raya · Eorzean Summer Festival 2026</p>
        <Link href="/">Back to serahill.net</Link>
      </footer>
    </main>
  );
}
