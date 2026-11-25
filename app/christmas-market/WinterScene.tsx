import type { CSSProperties } from "react";
import { Sparkle } from "lucide-react";
import styles from "./market.module.css";

type FlakeStyle = CSSProperties & Record<`--${string}`, string>;

/* Small seeded generator so the snow looks scattered but renders the same every time. */
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* CSS-only snowfall: fills its nearest positioned parent, no JavaScript on the client. */
export function Snowfall({ count = 26, seed = 7 }: { count?: number; seed?: number }) {
  const next = seeded(seed);
  const flakes = Array.from({ length: count }, (_, index) => {
    const duration = 12 + next() * 12;
    const style: FlakeStyle = {
      "--x": `${(((index + next()) / count) * 100).toFixed(2)}%`,
      "--y": `${(next() * 100).toFixed(2)}%`,
      "--size": `${(3 + next() * 5).toFixed(1)}px`,
      "--time": `${duration.toFixed(1)}s`,
      "--delay": `${(-next() * duration).toFixed(1)}s`,
      "--drift": `${((next() - 0.5) * 90).toFixed(0)}px`,
      "--alpha": (0.5 + next() * 0.45).toFixed(2),
    };
    return { index, style };
  });

  return (
    <div className={styles.snow} aria-hidden="true">
      {flakes.map((flake) => (
        <span className={styles.flake} key={flake.index} style={flake.style} />
      ))}
    </div>
  );
}

const pineTiers = [
  { top: -92, bottom: -14, half: 46 },
  { top: -128, bottom: -58, half: 36 },
  { top: -160, bottom: -98, half: 26 },
] as const;

function Pine({
  x,
  y,
  scale,
  tone,
}: {
  x: number;
  y: number;
  scale: number;
  tone: "near" | "far";
}) {
  const [light, dark] = tone === "near" ? ["#e588aa", "#c4527f"] : ["#f1abc4", "#dd84a7"];

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="-4" y="-16" width="8" height="16" fill="#6b2a55" />
      {pineTiers.map((tier) => (
        <g key={tier.top}>
          <polygon points={`0,${tier.top} ${-tier.half},${tier.bottom} 0,${tier.bottom}`} fill={light} />
          <polygon points={`0,${tier.top} ${tier.half},${tier.bottom} 0,${tier.bottom}`} fill={dark} />
        </g>
      ))}
      <polygon points="0,-160 -11.5,-132 0,-137" fill="#ffffff" />
      <polygon points="0,-160 11.5,-132 0,-137" fill="#fbdde8" />
    </g>
  );
}

/* Everything decorative behind the header stage: sky details, snow, hills and pines. */
export function WinterScene() {
  return (
    <div className={styles.scene} aria-hidden="true">
      <Sparkle className={`${styles.star} ${styles.starOne}`} />
      <Sparkle className={`${styles.star} ${styles.starTwo}`} />
      <Sparkle className={`${styles.star} ${styles.starThree}`} />
      <Sparkle className={`${styles.star} ${styles.starFour}`} />

      <svg className={`${styles.hill} ${styles.hillBack}`} viewBox="0 0 1440 220" preserveAspectRatio="none">
        <path d="M0,96 C160,44 340,30 540,78 C740,126 900,132 1090,84 C1230,50 1350,58 1440,92 L1440,220 L0,220 Z" />
      </svg>

      <svg className={`${styles.grove} ${styles.groveLeft}`} viewBox="0 0 300 200">
        <Pine x={150} y={186} scale={0.78} tone="far" />
        <Pine x={62} y={196} scale={1.15} tone="near" />
        <Pine x={232} y={198} scale={0.94} tone="near" />
      </svg>
      <svg className={`${styles.grove} ${styles.groveRight}`} viewBox="0 0 300 200">
        <Pine x={146} y={186} scale={0.7} tone="far" />
        <Pine x={70} y={198} scale={0.9} tone="near" />
        <Pine x={236} y={196} scale={1.2} tone="near" />
      </svg>

      <svg className={`${styles.hill} ${styles.hillFront}`} viewBox="0 0 1440 220" preserveAspectRatio="none">
        <path d="M0,150 C220,110 420,178 720,158 C1010,138 1220,176 1440,132 L1440,220 L0,220 Z" />
      </svg>

      <Snowfall count={28} seed={11} />
    </div>
  );
}
