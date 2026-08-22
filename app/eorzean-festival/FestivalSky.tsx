"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Cloud, Sparkles, Sun, Waves } from "lucide-react";
import styles from "./festival.module.css";

const petals = [
  { left: "7%", top: "25%", color: "pink", duration: 17, delay: 0, drift: 48 },
  { left: "19%", top: "15%", color: "yellow", duration: 21, delay: 7, drift: -32 },
  { left: "32%", top: "36%", color: "white", duration: 19, delay: 3, drift: 38 },
  { left: "43%", top: "19%", color: "pink", duration: 24, delay: 11, drift: -46 },
  { left: "51%", top: "52%", color: "yellow", duration: 18, delay: 5, drift: 42 },
  { left: "61%", top: "31%", color: "white", duration: 22, delay: 1, drift: -30 },
  { left: "71%", top: "12%", color: "pink", duration: 20, delay: 9, drift: 36 },
  { left: "82%", top: "42%", color: "yellow", duration: 25, delay: 4, drift: -50 },
  { left: "91%", top: "22%", color: "white", duration: 18, delay: 13, drift: 34 },
] as const;

export function FestivalSky() {
  const reduceMotion = useReducedMotion();

  return (
    <div className={styles.animatedSky} aria-hidden="true">
      <motion.div
        className={styles.animatedSun}
        initial={false}
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 46, ease: "linear", repeat: Infinity }}
      >
        <Sun size={80} strokeWidth={1.35} />
      </motion.div>

      <motion.div
        className={`${styles.skyCloud} ${styles.cloudOne}`}
        initial={false}
        animate={reduceMotion ? undefined : { x: [0, 34, 0], y: [0, -7, 0] }}
        transition={{ duration: 20, ease: "easeInOut", repeat: Infinity }}
      >
        <Cloud />
      </motion.div>
      <motion.div
        className={`${styles.skyCloud} ${styles.cloudTwo}`}
        initial={false}
        animate={reduceMotion ? undefined : { x: [0, -46, 0], y: [0, 6, 0] }}
        transition={{ duration: 27, ease: "easeInOut", repeat: Infinity }}
      >
        <Cloud />
      </motion.div>
      <motion.div
        className={`${styles.skyCloud} ${styles.cloudThree}`}
        initial={false}
        animate={reduceMotion ? undefined : { x: [0, 26, 0] }}
        transition={{ duration: 23, ease: "easeInOut", repeat: Infinity }}
      >
        <Cloud />
      </motion.div>

      <motion.div
        className={styles.skySparkle}
        initial={false}
        animate={
          reduceMotion
            ? undefined
            : { rotate: [0, 10, -5, 0], scale: [1, 1.12, 0.96, 1] }
        }
        transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
      >
        <Sparkles />
      </motion.div>

      <motion.div
        className={styles.skyWaves}
        initial={false}
        animate={reduceMotion ? undefined : { x: [0, 24, 0], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 12, ease: "easeInOut", repeat: Infinity }}
      >
        <Waves />
        <Waves />
        <Waves />
      </motion.div>

      {petals.map((petal, index) => (
        <motion.span
          className={`${styles.skyPetal} ${styles[`petal${petal.color}`]}`}
          key={`${petal.left}-${petal.top}`}
          style={{ left: petal.left, top: petal.top }}
          initial={false}
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [0, petal.drift, petal.drift / 3, 0],
                  y: [0, 55, 118, 176],
                  rotate: [index * 13, 95, 210, 310],
                  opacity: [0, 0.32, 0.25, 0],
                }
          }
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            ease: "linear",
            repeat: Infinity,
          }}
        />
      ))}
    </div>
  );
}
