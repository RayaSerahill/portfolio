"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./market.module.css";

const MODEL = "/christmas-market/necklace.glb";

/* The header's 3D necklace. three.js and the model only start loading once the page is up. */
export function NecklaceViewer() {
  const container = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    const element = container.current;
    if (!element) return;

    let cancelled = false;
    let dispose: (() => void) | undefined;

    import("./necklaceScene")
      .then(({ mountNecklace }) => mountNecklace(element, MODEL))
      .then((viewer) => {
        if (cancelled) {
          viewer.dispose();
          return;
        }
        dispose = () => viewer.dispose();
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("failed");
      });

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  return (
    <div className={styles.viewer} data-state={state} ref={container}>
      {state !== "ready" && (
        <p className={styles.viewerNote} role="status">
          {state === "loading" ? "Polishing the necklace…" : "The 3D preview could not load on this device."}
        </p>
      )}
    </div>
  );
}
