"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Shield, BarChart3, MessageSquare } from "lucide-react";
import FeatureBucket from "@/components/ui/feature-bucket";

const FEATURES = [
  {
    title: "Contact Management",
    headline: "Never lose track of a relationship.",
    description: "Organize contacts with custom fields, notes, company associations, and status tracking. Search across thousands of records in milliseconds.",
    bullets: ["Custom fields & tags", "Company associations", "Full-text search", "CSV import/export"],
    icon: Users,
  },
  {
    title: "Role-Based Access",
    headline: "Admins see everything. Reps see theirs.",
    description: "Row-level security ensures team members only access their assigned contacts. Admins get a full view with assignment controls.",
    bullets: ["Row-level security", "Admin vs member roles", "Contact assignment", "Audit trail"],
    icon: Shield,
  },
  {
    title: "Analytics Dashboard",
    headline: "Your pipeline at a glance.",
    description: "Track conversion rates, deal velocity, and team performance with real-time dashboards. Export reports as CSV with one click.",
    bullets: ["Real-time metrics", "Pipeline visualization", "Team performance", "One-click export"],
    icon: BarChart3,
  },
  {
    title: "Interaction Logging",
    headline: "Every touchpoint, tracked.",
    description: "Log calls, emails, and meetings tied to each contact. See the full interaction history at a glance — nothing slips through the cracks.",
    bullets: ["Call & email logging", "Meeting notes", "Activity timeline", "Auto-reminders"],
    icon: MessageSquare,
  },
];

const TOTAL = FEATURES.length;

export function Features() {
  const [activeIndex, setActiveIndex] = useState(0);
  const outerRef = useRef<HTMLDivElement>(null);

  // Use scroll position within the tall outer div to determine which feature is active
  useEffect(() => {
    const onScroll = () => {
      const outer = outerRef.current;
      if (!outer) return;

      const rect = outer.getBoundingClientRect();
      // How far we've scrolled into the outer container
      // rect.top starts positive (below viewport), goes to 0 (at top), then negative (scrolled past)
      const scrolledInto = -rect.top;
      const sectionHeight = outer.offsetHeight - window.innerHeight;

      if (scrolledInto < 0 || sectionHeight <= 0) {
        setActiveIndex(0);
        return;
      }

      const progress = Math.min(scrolledInto / sectionHeight, 1);
      const idx = Math.min(Math.floor(progress * TOTAL), TOTAL - 1);
      setActiveIndex(idx);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const detail = FEATURES[activeIndex];

  return (
    <>
      {/* Transition divider */}
      <div className="relative py-12">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-black/[0.08] to-transparent dark:via-white/[0.08]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A0A0A0]">Features</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-black/[0.08] to-transparent dark:via-white/[0.08]" />
        </div>
      </div>

      {/* Tall outer container — height creates the scroll distance for feature cycling */}
      {/* 4 features × 100vh = 400vh total, the sticky inner stays pinned */}
      <div ref={outerRef} id="features" style={{ height: `${TOTAL * 100}vh` }}>
        <div className="sticky top-0 h-screen flex items-center overflow-hidden">
          <div className="mx-auto max-w-6xl w-full px-6">
            {/* Header */}
            <div className="mb-10 text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#A0A0A0]">
                Built for modern teams
              </p>
              <h2
                className="text-[#141414] dark:text-[#F5F5F5]"
                style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 600, letterSpacing: "-0.4px", lineHeight: 1.1 }}
              >
                Everything you need to
                <br />
                manage relationships
              </h2>
            </div>

            {/* 2-column layout */}
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
              {/* Left — Bucket (hidden on mobile to prevent overflow) */}
              <div className="hidden lg:flex items-center justify-center">
                <div className="w-full max-w-sm rounded-sm border border-black/[0.04] bg-[#F5F5F5] pt-16 px-6 pb-6 dark:border-white/[0.04] dark:bg-[#141414]">
                  <FeatureBucket activeIndex={activeIndex} />
                </div>
              </div>

              {/* Right — Feature details */}
              <div className="relative min-h-[340px] flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={detail.title}
                    initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -16, filter: "blur(4px)" }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="flex flex-col"
                  >
                    {/* Feature number + label */}
                    <div className="flex items-center gap-3 mb-5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.08] text-xs font-semibold text-[#141414] dark:border-white/[0.08] dark:text-[#F5F5F5]">
                        {String(activeIndex + 1).padStart(2, "0")}
                      </span>
                      <div className="h-px w-6 bg-black/[0.12] dark:bg-white/[0.12]" />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#A0A0A0]">
                        {detail.title}
                      </span>
                    </div>

                    {/* Headline */}
                    <h3
                      className="text-[#141414] dark:text-[#F5F5F5]"
                      style={{ fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 600, letterSpacing: "-0.3px", lineHeight: 1.15 }}
                    >
                      {detail.headline}
                    </h3>

                    {/* Description */}
                    <p className="mt-4 text-sm text-[#707070] leading-relaxed md:text-base max-w-md">
                      {detail.description}
                    </p>

                    {/* Bullets */}
                    <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2.5">
                      {detail.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-center gap-2.5 text-sm text-[#141414] dark:text-[#F5F5F5]">
                          <span className="h-1 w-1 rounded-full bg-[#141414] dark:bg-[#F5F5F5] flex-shrink-0" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </AnimatePresence>

                {/* Progress bar */}
                <div className="mt-10 flex items-center gap-3">
                  {FEATURES.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-400 ${
                        i === activeIndex
                          ? "w-8 bg-[#141414] dark:bg-[#F5F5F5]"
                          : i < activeIndex
                          ? "w-4 bg-[#141414]/30 dark:bg-[#F5F5F5]/30"
                          : "w-2 bg-[#E0E0E0] dark:bg-[#333]"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-[11px] font-medium text-[#A0A0A0] tabular-nums">
                    {activeIndex + 1} of {TOTAL}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
