import { Cormorant_Garamond, Quicksand } from "next/font/google";
import Link from "next/link";
import { Mail, Snowflake } from "lucide-react";
import {
  Bauble,
  ChokerSketch,
  MetalDefs,
  MixSketch,
  NecklaceSketch,
  TagSketch,
  metals,
  type MetalId,
} from "./Illustrations";
import { NecklaceViewer } from "./NecklaceViewer";
import { Snowfall, WinterScene } from "./WinterScene";
import styles from "./market.module.css";

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-market-display",
});

const bodyFont = Quicksand({
  subsets: ["latin"],
  variable: "--font-market-body",
});

/* Add chain type names here and they are listed on the necklace card. */
const chainTypes: string[] = [];

const pieces = [
  {
    id: "necklace",
    name: "Necklace",
    Sketch: NecklaceSketch,
    description:
      "Hangs on a chain, and comes with the most to play with: pick the chain type, then a metal for every part.",
    choices: [
      "Text, logo, or both",
      "Chain type",
      "Metal for the chain",
      "Metal for the text",
      "Metal for the symbol",
    ],
  },
  {
    id: "choker",
    name: "Choker",
    Sketch: ChokerSketch,
    description: "Sits close around the neck and carries your text, your logo, or both.",
    choices: ["Text, logo, or both", "Metal finish"],
  },
] as const;

const personalisations = [
  {
    kind: "text",
    title: "Text",
    description: "Just words. A name, a nickname, whatever you want it to say.",
  },
  {
    kind: "logo",
    title: "Logo",
    description: "Just a logo or a symbol, no text needed.",
  },
  {
    kind: "both",
    title: "Text + logo",
    description: "Both of them together on the same piece.",
  },
] as const;

const exampleMix: { part: string; metal: MetalId }[] = [
  { part: "Chain", metal: "silver" },
  { part: "Text", metal: "rose" },
  { part: "Symbol", metal: "holo" },
];

const metalName = (id: MetalId) => metals.find((metal) => metal.id === id)?.name ?? id;

export default function ChristmasMarketPage() {
  return (
    <main className={`${styles.page} ${displayFont.variable} ${bodyFont.variable}`} id="top">
      <MetalDefs />

      <header className={styles.topbar}>
        <a className={styles.brand} href="#top" aria-label="Back to the top">
          <Snowflake aria-hidden="true" size={18} />
          <span>Raya at the Christmas Market</span>
        </a>
        <nav className={styles.nav} aria-label="Christmas Market page navigation">
          <a href="#piece">The piece</a>
          <a href="#personalise">Text &amp; logo</a>
          <a href="#metal">Metals</a>
        </nav>
      </header>

      {/*
        Header stage. The necklace viewer sits in viewerSlot with the moon ring behind it.
        controlsSlot is still empty: once it has children (the combination buttons) it becomes
        a column beside the viewer on desktop and stacks underneath on small screens.
      */}
      <section className={styles.hero}>
        <WinterScene />
        <div className={styles.garland} aria-hidden="true" />
        <div className={styles.stage}>
          <div className={styles.viewerSlot}>
            <NecklaceViewer />
          </div>
          <div className={styles.controlsSlot} />
        </div>
      </section>

      <section className={styles.intro}>
        <div className={styles.introInner}>
          <p className={styles.eventLabel}>
            <Snowflake aria-hidden="true" size={15} />
            Christmas Market · made to order
            <Snowflake aria-hidden="true" size={15} />
          </p>
          <h1>
            Custom necklaces <em>&amp;</em> chokers
          </h1>
          <p className={styles.lede}>
            A necklace or a choker with your own text, your own logo, or both, finished in the
            metal you like best.
          </p>
          <div className={styles.divider} aria-hidden="true">
            <Snowflake size={18} />
          </div>
        </div>
      </section>

      <section className={styles.section} id="piece">
        <div className={styles.inner}>
          <div className={styles.sectionHead}>
            <p className={styles.step}>
              <span>01</span>The piece
            </p>
            <h2>Necklace or choker</h2>
            <p>Start by picking which one you want. Everything else builds on that.</p>
          </div>

          <div className={styles.pieceGrid}>
            {pieces.map(({ id, name, Sketch, description, choices }) => (
              <article className={styles.pieceCard} key={id}>
                <div className={styles.pieceArt}>
                  <Sketch />
                </div>
                <div className={styles.pieceBody}>
                  <h3>{name}</h3>
                  <p>{description}</p>
                  <p className={styles.chooseLabel}>You choose</p>
                  <ul className={styles.chooseList}>
                    {choices.map((choice) => (
                      <li key={choice}>
                        <Snowflake aria-hidden="true" size={15} />
                        {choice}
                      </li>
                    ))}
                  </ul>
                  {id === "necklace" && chainTypes.length > 0 && (
                    <>
                      <p className={styles.chooseLabel}>Chain types</p>
                      <ul className={styles.chipList}>
                        {chainTypes.map((type) => (
                          <li key={type}>{type}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.tinted}`} id="personalise">
        <div className={styles.inner}>
          <div className={styles.sectionHead}>
            <p className={styles.step}>
              <span>02</span>Text &amp; logo
            </p>
            <h2>Your text, your logo, or both</h2>
            <p>Each one works on its own, and they work together too.</p>
          </div>

          <div className={styles.tagGrid}>
            {personalisations.map((option) => (
              <article className={styles.tag} key={option.kind}>
                <div className={styles.tagArt}>
                  <TagSketch kind={option.kind} />
                </div>
                <h3>{option.title}</h3>
                <p>{option.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} id="metal">
        <div className={styles.inner}>
          <div className={styles.sectionHead}>
            <p className={styles.step}>
              <span>03</span>Metal
            </p>
            <h2>Five metal finishes</h2>
            <p>Silver, black metallic, gold, rose gold, or holographic.</p>
          </div>

          <div className={styles.rail} aria-hidden="true" />
          <ul className={styles.baubles}>
            {metals.map((metal) => (
              <li className={styles.baubleItem} key={metal.id}>
                <span className={styles.hang}>
                  <Bauble metal={metal.id} />
                </span>
                <span className={styles.baubleName}>{metal.name}</span>
              </li>
            ))}
          </ul>

          <article className={styles.mix}>
            <div className={styles.mixArt}>
              <span className={styles.mixNote}>Example mix</span>
              <MixSketch background="#fdeef3" />
            </div>
            <div className={styles.mixCopy}>
              <h3>On a necklace, you choose three times</h3>
              <p>
                The chain, the text and the symbol each get their own metal. Match all three, or
                mix them like this one.
              </p>
              <ol className={styles.legend}>
                {exampleMix.map((row, index) => (
                  <li key={row.part}>
                    <span className={styles.legendNumber} aria-hidden="true">
                      {index + 1}
                    </span>
                    {row.part}
                    <span className={styles.legendMetal}>
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <circle
                          cx="10"
                          cy="10"
                          r="8.5"
                          fill={`url(#cm-${row.metal})`}
                          stroke="rgba(58, 22, 50, 0.34)"
                        />
                      </svg>
                      {metalName(row.metal)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.closing}>
        <svg className={styles.drift} viewBox="0 0 1440 52" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,0 H1440 V20 C1320,50 1200,10 1080,28 C960,46 840,12 720,26 C600,40 480,8 360,28 C240,48 120,14 0,32 Z" />
        </svg>
        <Snowfall count={18} seed={23} />
        <div className={styles.closingInner}>
          <p className={styles.closingLabel}>See you at the market</p>
          <h2>Tell me what yours should say</h2>
          <p>
            Come find me at the Christmas Market with your piece, your text or logo, and your
            metals.
          </p>
          <div className={styles.actions}>
            <a className={styles.button} href="mailto:rayaserahill@gmail.com">
              <Mail aria-hidden="true" size={18} />
              Email me
            </a>
            <p className={styles.discord}>
              Quicker on Discord, where I&apos;m <strong>Raya</strong>
            </p>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>Made by Raya · Christmas Market 2026</p>
        <Link href="/">Back to serahill.net</Link>
      </footer>
    </main>
  );
}
