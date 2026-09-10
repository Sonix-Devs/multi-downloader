"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

/** Smoothly tweens a displayed number toward `value` using easing, instead of snapping. */
export function AnimatedCounter({ value, decimals = 0, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    const controls = animate(previous.current, value, {
      duration: 0.5,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    previous.current = value;
    return () => controls.stop();
  }, [value]);

  return (
    <span className="tabular-nums">
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
