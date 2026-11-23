/*
  Hand-drawn SVG stand-ins for the jewellery. They are stylised sketches, not renders
  of the real pieces: the real thing will live in the header's model viewer.
*/

export const metals = [
  { id: "silver", name: "Silver", stops: ["#fbfbfd", "#c7c9d3", "#f4f4f8", "#9ea2b0", "#dcdde5"] },
  { id: "black", name: "Black metallic", stops: ["#6b6570", "#1d1a21", "#57525d", "#0f0d12", "#3b3641"] },
  { id: "gold", name: "Gold", stops: ["#fff4c9", "#dcae45", "#fff1bf", "#b17f22", "#eac564"] },
  { id: "rose", name: "Rose gold", stops: ["#ffe6de", "#e3a091", "#ffe9e2", "#c07a6f", "#efb9aa"] },
  { id: "holo", name: "Holographic", stops: ["#a8ecff", "#d6bcff", "#ffc0e3", "#fff0b3", "#b8ffd6", "#a8d4ff"] },
] as const;

export type MetalId = (typeof metals)[number]["id"];

const fill = (metal: MetalId) => `url(#cm-${metal})`;
const RIM = "rgba(58, 22, 50, 0.34)";
const HEART =
  "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z";

/* Shared gradient definitions. Render once per page; every sketch below points at these. */
export function MetalDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        {metals.map((metal) => (
          <linearGradient id={`cm-${metal.id}`} key={metal.id} x1="0" y1="0" x2="1" y2="1">
            {metal.stops.map((color, index) => (
              <stop key={color} offset={index / (metal.stops.length - 1)} stopColor={color} />
            ))}
          </linearGradient>
        ))}
      </defs>
    </svg>
  );
}

function Chain({
  d,
  metal,
  size,
  background,
}: {
  d: string;
  metal: MetalId;
  size: number;
  background: string;
}) {
  const links = `${size * 1.3} ${size * 1.35}`;

  return (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke={RIM} strokeWidth={size + 1.3} strokeDasharray={links} />
      <path d={d} stroke={fill(metal)} strokeWidth={size} strokeDasharray={links} />
      <path
        d={d}
        stroke={background}
        strokeWidth={size * 0.32}
        strokeDasharray={`${size} ${size * 1.65}`}
        strokeDashoffset={-size * 0.15}
      />
    </g>
  );
}

function Heart({ x, y, size, metal }: { x: number; y: number; size: number; metal: MetalId }) {
  return (
    <path
      d={HEART}
      transform={`translate(${x} ${y}) scale(${size / 24})`}
      fill={fill(metal)}
      stroke={RIM}
      strokeWidth={24 / size}
      strokeLinejoin="round"
    />
  );
}

function Engraving({
  x,
  y,
  size,
  metal,
  anchor = "middle",
  children,
}: {
  x: number;
  y: number;
  size: number;
  metal: MetalId;
  anchor?: "start" | "middle" | "end";
  children: string;
}) {
  return (
    <g
      fontSize={size}
      fontStyle="italic"
      fontWeight="600"
      textAnchor={anchor}
      style={{ fontFamily: "var(--display)" }}
    >
      <text x={x} y={y} fill="none" stroke={RIM} strokeWidth={size * 0.045} strokeLinejoin="round">
        {children}
      </text>
      <text x={x} y={y} fill={fill(metal)}>
        {children}
      </text>
    </g>
  );
}

const BUST =
  "M118,0 L118,54 C118,80 92,92 56,102 C24,111 0,124 0,146 L0,180 L320,180 L320,146 C320,124 296,111 264,102 C228,92 202,80 202,54 L202,0 Z";
const SKIN = "#f7cad8";

function Bust() {
  return (
    <>
      <path d={BUST} fill={SKIN} />
      <path
        d="M92,116 Q126,127 154,120 M228,116 Q194,127 166,120"
        fill="none"
        stroke="#eeb0c5"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </>
  );
}

export function NecklaceSketch() {
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
      <Bust />
      <Chain
        d="M119,30 C121,98 146,132 160,132 C174,132 199,98 201,30"
        metal="silver"
        size={3.4}
        background={SKIN}
      />
      <rect x="141" y="131" width="38" height="11" rx="2.5" fill={fill("rose")} stroke={RIM} />
      <Heart x={152.5} y={145} size={15} metal="holo" />
    </svg>
  );
}

export function ChokerSketch() {
  const band = "M104,25 Q160,47 216,25";

  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
      <defs>
        <clipPath id="cm-neck">
          <path d={BUST} />
        </clipPath>
      </defs>
      <Bust />
      <g clipPath="url(#cm-neck)" fill="none">
        <path d={band} stroke="#c33f72" strokeWidth="14" />
        <path d={band} stroke="#f9d3df" strokeDasharray="3 3" transform="translate(0 -4.6)" />
        <path d={band} stroke="#f9d3df" strokeDasharray="3 3" transform="translate(0 4.6)" />
      </g>
      <rect x="142" y="31" width="36" height="10" rx="2.5" fill={fill("silver")} stroke={RIM} />
      <Heart x={153.5} y={44.5} size={13} metal="silver" />
    </svg>
  );
}

export function TagSketch({ kind }: { kind: "text" | "logo" | "both" }) {
  return (
    <svg viewBox="0 0 200 80" aria-hidden="true">
      {kind === "text" && (
        <Engraving x={100} y={56} size={50} metal="rose">
          Raya
        </Engraving>
      )}
      {kind === "logo" && <Heart x={77} y={17} size={46} metal="rose" />}
      {kind === "both" && (
        <>
          <Engraving x={124} y={56} size={50} metal="rose" anchor="end">
            Raya
          </Engraving>
          <Heart x={134} y={26} size={32} metal="rose" />
        </>
      )}
    </svg>
  );
}

function Marker({ x, y, from, label }: { x: number; y: number; from: [number, number]; label: string }) {
  return (
    <g>
      <line
        x1={from[0]}
        y1={from[1]}
        x2={x}
        y2={y}
        stroke="#c33f72"
        strokeWidth="1.2"
        strokeDasharray="2 3.5"
        strokeLinecap="round"
      />
      <circle cx={x} cy={y} r="11.5" fill="#fff" stroke="#c33f72" strokeWidth="1.5" />
      <text
        x={x}
        y={y + 4.4}
        textAnchor="middle"
        fontSize="13"
        fontWeight="600"
        fill="#c33f72"
        style={{ fontFamily: "var(--body)" }}
      >
        {label}
      </text>
    </g>
  );
}

/* Close-up of a necklace wearing three different finishes, with numbered parts. */
export function MixSketch({ background }: { background: string }) {
  return (
    <svg
      viewBox="0 0 360 250"
      role="img"
      aria-label="A necklace with a silver chain, rose gold text and a holographic heart symbol"
    >
      <Chain d="M40,8 C52,90 92,150 138,160" metal="silver" size={5.6} background={background} />
      <Chain d="M320,8 C308,90 268,150 222,160" metal="silver" size={5.6} background={background} />

      <circle cx="282" cy="120" r="4.6" fill="none" stroke={RIM} strokeWidth="3.4" />
      <circle cx="282" cy="120" r="4.6" fill="none" stroke={fill("silver")} strokeWidth="2.2" />
      <Heart x={268.5} y={124} size={27} metal="holo" />

      <Engraving x={180} y={178} size={60} metal="rose">
        Raya
      </Engraving>

      <Marker x={36} y={140} from={[62, 102]} label="1" />
      <Marker x={180} y={224} from={[180, 192]} label="2" />
      <Marker x={332} y={178} from={[301, 148]} label="3" />
    </svg>
  );
}

export function Bauble({ metal }: { metal: MetalId }) {
  return (
    <svg viewBox="0 0 100 116" aria-hidden="true">
      <circle cx="50" cy="8" r="5" fill="none" stroke="#b9892f" strokeWidth="2" />
      <rect x="40" y="12" width="20" height="12" rx="3" fill={fill("gold")} stroke={RIM} />
      <circle cx="50" cy="68" r="45" fill={fill(metal)} stroke={RIM} strokeWidth="1.5" />
      <ellipse cx="34" cy="48" rx="12" ry="6.5" transform="rotate(-38 34 48)" fill="#fff" fillOpacity="0.7" />
    </svg>
  );
}
