"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

const ScrollMorphHero = dynamic(
  () => import("@/components/ui/scroll-morph-hero"),
  { ssr: false }
);

export function ScrollIntro() {
  const [fading, setFading] = useState(false);
  const [removed, setRemoved] = useState(false);

  // Lock body scroll while overlay is active
  useEffect(() => {
    if (removed) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [removed]);

  useEffect(() => {
    const handler = () => {
      // Hold for a moment, then fade out
      setTimeout(() => setFading(true), 800);
      // Remove overlay and unlock scroll
      setTimeout(() => setRemoved(true), 1500);
    };
    window.addEventListener("morph-done", handler);
    return () => window.removeEventListener("morph-done", handler);
  }, []);

  if (removed) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background"
      style={{
        opacity: fading ? 0 : 1,
        transition: "opacity 0.7s ease-out",
      }}
    >
      <ScrollMorphHero />
    </div>
  );
}
