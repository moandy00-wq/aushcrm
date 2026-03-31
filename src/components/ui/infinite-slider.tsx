"use client";

import { cn } from "@/lib/utils";
import React, { CSSProperties } from "react";

type InfiniteSliderProps = {
  children: React.ReactNode;
  gap?: number;
  speed?: number;
  reverse?: boolean;
  className?: string;
  pauseOnHover?: boolean;
};

export function InfiniteSlider({
  children,
  gap = 16,
  speed = 40,
  reverse = false,
  className,
  pauseOnHover = true,
}: InfiniteSliderProps) {
  return (
    <div
      className={cn("group flex overflow-hidden", className)}
      style={
        {
          "--duration": `${speed}s`,
          "--gap": `${gap}px`,
        } as CSSProperties
      }
    >
      <div
        className={cn(
          "flex shrink-0 animate-marquee items-center",
          reverse && "[animation-direction:reverse]",
          pauseOnHover && "group-hover:[animation-play-state:paused]"
        )}
        style={{ gap: `${gap}px` }}
      >
        {children}
      </div>
      <div
        className={cn(
          "flex shrink-0 animate-marquee items-center",
          reverse && "[animation-direction:reverse]",
          pauseOnHover && "group-hover:[animation-play-state:paused]"
        )}
        style={{ gap: `${gap}px` }}
        aria-hidden="true"
      >
        {children}
      </div>
    </div>
  );
}

type BlurredInfiniteSliderProps = InfiniteSliderProps;

export function BlurredInfiniteSlider({
  className,
  ...props
}: BlurredInfiniteSliderProps) {
  return (
    <div className={cn("relative", className)}>
      <div
        className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24"
        style={{
          maskImage:
            "linear-gradient(to right, black, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, black, transparent)",
          background: "var(--background)",
        }}
      />
      <div
        className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24"
        style={{
          maskImage:
            "linear-gradient(to left, black, transparent)",
          WebkitMaskImage:
            "linear-gradient(to left, black, transparent)",
          background: "var(--background)",
        }}
      />
      <InfiniteSlider {...props} />
    </div>
  );
}
