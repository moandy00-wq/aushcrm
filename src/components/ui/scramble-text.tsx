"use client";

import { useEffect, useRef } from "react";
import { useScramble } from "use-scramble";
import { cn } from "@/lib/utils";

interface ScrambleTextProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
}

export function ScrambleText({
  text,
  className,
  speed = 0.8,
  delay = 0,
}: ScrambleTextProps) {
  const hasStarted = useRef(false);

  const { ref, replay } = useScramble({
    text,
    speed,
    tick: 2,
    step: 1,
    scramble: 3,
    playOnMount: false,
  });

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    const timer = setTimeout(() => replay(), delay);
    return () => clearTimeout(timer);
  }, [delay, replay]);

  return (
    <>
      <span className="sr-only">{text}</span>
      <span className={cn("inline-block", className)} aria-hidden="true">
        <span ref={ref} />
      </span>
    </>
  );
}
