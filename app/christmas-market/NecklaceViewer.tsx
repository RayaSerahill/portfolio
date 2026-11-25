"use client";

import { Bone, Heart, HeartHandshake, Star, Triangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./market.module.css";
import type { ModelId, NecklaceViewer as Viewer } from "./necklaceScene";

type Piece = { id: ModelId; label: string; Icon: typeof Bone };

/* the necklaces on offer, one button each; the first is the one the page opens with */
const NECKLACES = [
  { id: "necklace", label: "Raya", Icon: Heart },
  { id: "puppy", label: "Puppy", Icon: Bone },
  { id: "star", label: "Star", Icon: Star },
] as const satisfies readonly Piece[];

/* and the collars, which get their buttons on the other side of the viewer */
const COLLARS = [
  { id: "dom", label: "Dom", Icon: Triangle },
  { id: "shie", label: "Shie", Icon: HeartHandshake },
] as const satisfies readonly Piece[];

/*
  Puts a 3D viewer showing `first` into the element that gets `container`. three.js and the
  model only start loading once the page is up, and with `whenNear` they also wait until the
  element is about to scroll into view.
*/
function useViewer(first: ModelId, whenNear = false) {
  const container = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    const element = container.current;
    if (!element) return;

    let cancelled = false;

    function mount(into: HTMLElement) {
      import("./necklaceScene")
        .then(({ mountNecklace }) => mountNecklace(into, first))
        .then((mounted) => {
          if (cancelled) {
            mounted.dispose();
            return;
          }
          viewer.current = mounted;
          setState("ready");
        })
        .catch(() => {
          if (!cancelled) setState("failed");
        });
    }

    let nearness: IntersectionObserver | undefined;
    if (whenNear) {
      nearness = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          nearness?.disconnect();
          mount(element);
        },
        { rootMargin: "400px 0px" },
      );
      nearness.observe(element);
    } else {
      mount(element);
    }

    return () => {
      cancelled = true;
      nearness?.disconnect();
      viewer.current?.dispose();
      viewer.current = null;
    };
  }, [first, whenNear]);

  return { container, viewer, state };
}

const note = (state: "loading" | "failed", name: string) =>
  state === "loading" ? `Polishing the ${name}…` : "The 3D preview could not load on this device.";

/*
  The header's 3D viewer, with a button for each piece on offer: necklaces to its left and
  collars to its right. Only the first model loads with the viewer; the others wait for
  their button.
*/
export function NecklaceViewer() {
  const { container, viewer, state } = useViewer(NECKLACES[0].id);
  const [model, setModel] = useState<ModelId>(NECKLACES[0].id);
  const [switching, setSwitching] = useState(false);

  /* one swap at a time: nothing changes again until the piece asked for is on screen */
  function pick(id: ModelId) {
    const mounted = viewer.current;
    if (!mounted || switching || id === model) return;
    const previous = model;
    setModel(id);
    setSwitching(true);
    mounted
      .show(id)
      .catch(() => setModel(previous))
      .finally(() => setSwitching(false));
  }

  const picker = (pieces: readonly Piece[], name: string, className: string) => (
    <div className={className} role="group" aria-label={name}>
      {pieces.map(({ id, label, Icon }) => (
        <button
          className={styles.modelButton}
          type="button"
          key={id}
          aria-pressed={model === id}
          aria-busy={switching && model === id}
          onClick={() => pick(id)}
        >
          <Icon aria-hidden="true" size={18} />
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      {state === "ready" && (
        <>
          {picker(NECKLACES, "Choose a necklace", styles.modelPicker)}
          {picker(COLLARS, "Choose a collar", `${styles.modelPicker} ${styles.collarPicker}`)}
        </>
      )}
      <div className={styles.viewer} data-state={state} ref={container}>
        {state !== "ready" && (
          <p className={styles.viewerNote} role="status">
            {note(state, "necklace")}
          </p>
        )}
      </div>
    </>
  );
}

/*
  One piece on its own, for the cards further down the page: the same viewer without the
  buttons. `name` is what the card calls the piece. Nothing loads before the card is close
  to being on screen.
*/
export function PieceViewer({ model, name }: { model: ModelId; name: string }) {
  const { container, state } = useViewer(model, true);

  return (
    <div className={styles.pieceViewer} data-state={state} ref={container}>
      {state !== "ready" && (
        <p className={styles.viewerNote} role="status">
          {note(state, name)}
        </p>
      )}
    </div>
  );
}
