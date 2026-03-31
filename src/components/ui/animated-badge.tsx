"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { motion } from "motion/react";

type AnimatedBadgeProps = {
  text?: string;
  color?: string;
  href?: string;
};

function hexToRgba(hexColor: string, alpha: number): string {
  const hex = hexColor.replace("#", "");
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hexColor;
}

export function AnimatedBadge({
  text = "Introducing AushCRM",
  color = "#141414",
  href,
}: AnimatedBadgeProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: -10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      className="group relative flex max-w-fit items-center justify-center gap-3 rounded-full border border-black/[0.08] bg-white px-4 py-1.5 text-[#141414] transition-colors dark:border-white/[0.08] dark:bg-[#0F1219] dark:text-[#F5F5F5]"
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-full h-20 w-[165px]">
        <svg className="h-full w-full" viewBox="0 0 50 50" fill="none">
          <g mask="url(#ml-mask-1)">
            <circle
              className="multiline ml-light-1"
              cx="0"
              cy="0"
              r="20"
              fill="url(#ml-mono-grad)"
            />
          </g>
          <defs>
            <mask id="ml-mask-1">
              <path
                d="M 69 49.8 h -30 q -3 0 -3 -3 v -13 q 0 -3 -3 -3 h -23 q -3 0 -3 -3 v -13 q 0 -3 -3 -3 h -50"
                strokeWidth="0.6"
                stroke="white"
              />
            </mask>
            <radialGradient id="ml-mono-grad" fx="1">
              <stop offset="0%" stopColor={color} />
              <stop offset="20%" stopColor={color} />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
        </svg>
      </div>
      <div
        className="relative flex h-1.5 w-1.5 items-center justify-center rounded-full"
        style={{ backgroundColor: hexToRgba(color, 0.4) }}
      >
        <div
          className="flex h-2 w-2 animate-ping items-center justify-center rounded-full"
          style={{ backgroundColor: color }}
        />
        <div
          className="absolute top-1/2 left-1/2 flex h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
          style={{ backgroundColor: hexToRgba(color, 0.8) }}
        />
      </div>
      <div className="mx-1 h-4 w-px bg-black/[0.08] dark:bg-white/[0.08]" />
      <span className="text-xs font-medium tracking-tight">{text}</span>
      <ChevronRight className="ml-0.5 h-3 w-3 text-[#A0A0A0] transition-transform duration-200 group-hover:translate-x-0.5" />
    </motion.div>
  );

  return (
    <>
      {href ? (
        <Link href={href} className="inline-block">
          {content}
        </Link>
      ) : (
        content
      )}
      <style>{`
.multiline {
  offset-anchor: 10px 0px;
  animation: multiline-animation-path 3s linear infinite;
}
.ml-light-1 {
  offset-path: path(
    "M 69 49.8 h -30 q -3 0 -3 -3 v -13 q 0 -3 -3 -3 h -23 q -3 0 -3 -3 v -13 q 0 -3 -3 -3 h -50"
  );
}
@keyframes multiline-animation-path {
  0% { offset-distance: 0%; }
  50% { offset-distance: 100%; }
  100% { offset-distance: 100%; }
}
      `}</style>
    </>
  );
}
