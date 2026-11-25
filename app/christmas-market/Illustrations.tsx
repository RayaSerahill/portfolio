/*
  Hand-drawn SVG sketches for the gift tags and the metal baubles. They are stylised, not
  renders of the real pieces: those are shown in 3D by NecklaceViewer.
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
