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
  The header's 3D viewer, with a button for each piece on offer: necklaces to its left and
  collars to its right. three.js and the first model only start loading once the page is up;
  the others wait for their button.
*/
export function NecklaceViewer() {
  const container = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const [model, setModel] = useState<ModelId>(NECKLACES[0].id);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    const element = container.current;
    if (!element) return;

    let cancelled = false;

    import("./necklaceScene")
      .then(({ mountNecklace }) => mountNecklace(element, NECKLACES[0].id))
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

    return () => {
      cancelled = true;
      viewer.current?.dispose();
      viewer.current = null;
    };
  }, []);

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
            {state === "loading" ? "Polishing the necklace…" : "The 3D preview could not load on this device."}
          </p>
        )}
      </div>
    </>
  );
}
