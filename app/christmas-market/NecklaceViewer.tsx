"use client";

import { Bone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./market.module.css";
import type { ModelId, NecklaceViewer as Viewer } from "./necklaceScene";

/*
  The header's 3D necklace, with a button beside it that swaps in the puppy one. three.js and
  the first model only start loading once the page is up; the puppy model waits for its button.
*/
export function NecklaceViewer() {
  const container = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const [model, setModel] = useState<ModelId>("necklace");
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    const element = container.current;
    if (!element) return;

    let cancelled = false;

    import("./necklaceScene")
      .then(({ mountNecklace }) => mountNecklace(element, "necklace"))
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

  /* one swap at a time: the button stays as it is until the model it asked for is on screen */
  function togglePuppy() {
    const mounted = viewer.current;
    if (!mounted || switching) return;
    const previous = model;
    const next = model === "puppy" ? "necklace" : "puppy";
    setModel(next);
    setSwitching(true);
    mounted
      .show(next)
      .catch(() => setModel(previous))
      .finally(() => setSwitching(false));
  }

  return (
    <>
      {state === "ready" && (
        <div className={styles.modelPicker}>
          <button
            className={styles.modelButton}
            type="button"
            aria-pressed={model === "puppy"}
            aria-busy={switching}
            onClick={togglePuppy}
          >
            <Bone aria-hidden="true" size={18} />
            Puppy
          </button>
        </div>
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
