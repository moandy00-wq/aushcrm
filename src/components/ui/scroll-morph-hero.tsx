"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

// --- Types ---
export type AnimationPhase = "scatter" | "line" | "circle";

interface Integration {
  name: string;
  category: string;
  description: string;
  logo: string;
}

interface FlipCardProps {
  integration: Integration;
  index: number;
  total: number;
  phase: AnimationPhase;
  isScrolling: boolean;
  target: { x: number; y: number; rotation: number; scale: number; opacity: number };
}

// --- FlipCard ---
const CARD_W = 72;
const CARD_H = 96;
const EXPANDED_W = 220;
const EXPANDED_H = 160;

function FlipCard({ integration, index, target, isScrolling }: FlipCardProps) {
  const [hovered, setHovered] = useState(false);
  // Collapse if scrolling starts
  const expanded = hovered && !isScrolling;

  return (
    <motion.div
      animate={{
        x: target.x,
        y: target.y,
        rotate: expanded ? 0 : target.rotation,
        scale: target.scale,
        opacity: target.opacity,
      }}
      transition={{ type: "spring", stiffness: 50, damping: 18 }}
      style={{ position: "absolute", zIndex: expanded ? 50 : index }}
      className={isScrolling ? "pointer-events-none" : "cursor-pointer"}
      onMouseEnter={() => { if (!isScrolling) setHovered(true); }}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        animate={{
          width: expanded ? EXPANDED_W : CARD_W,
          height: expanded ? EXPANDED_H : CARD_H,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="overflow-hidden rounded-sm border border-black/[0.06] bg-white dark:border-white/[0.06] dark:bg-[#1C1C1C]"
        style={{ boxShadow: expanded ? "0 20px 40px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.04)" }}
      >
        {!expanded ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={integration.logo} alt={integration.name} className="h-7 w-7 object-contain" />
            <p className="text-[8px] font-semibold text-[#141414] dark:text-[#F5F5F5] text-center leading-tight truncate w-full">{integration.name}</p>
            <p className="text-[6px] text-[#A0A0A0] uppercase tracking-wider font-medium">{integration.category}</p>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col p-4">
            <div className="flex items-center gap-3 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={integration.logo} alt={integration.name} className="h-8 w-8 object-contain flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#141414] dark:text-[#F5F5F5]">{integration.name}</p>
                <p className="text-[10px] text-[#A0A0A0] uppercase tracking-wider font-medium">{integration.category}</p>
              </div>
            </div>
            <p className="text-xs text-[#707070] dark:text-[#A0A0A0] leading-relaxed">{integration.description}</p>
            <div className="mt-auto pt-2">
              <span className="text-[10px] font-medium text-[#141414] dark:text-[#F5F5F5] border-b border-[#141414]/20 dark:border-[#F5F5F5]/20 pb-px">Learn more →</span>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// --- Integrations ---
const INTEGRATIONS: Integration[] = [
  { name: "Slack", category: "Messaging", description: "Send CRM alerts and deal updates directly to Slack channels.", logo: "https://svgl.app/library/slack.svg" },
  { name: "Gmail", category: "Email", description: "Sync emails, log conversations, and track opens from Gmail.", logo: "https://svgl.app/library/gmail.svg" },
  { name: "Stripe", category: "Payments", description: "Track revenue, invoices, and payment status per contact.", logo: "https://svgl.app/library/stripe.svg" },
  { name: "Zapier", category: "Automation", description: "Connect 5,000+ apps with no-code workflow automations.", logo: "https://cdn.simpleicons.org/zapier/141414" },
  { name: "Google Calendar", category: "Scheduling", description: "Sync meetings and auto-log calendar events to contacts.", logo: "https://svgl.app/library/google-calendar.svg" },
  { name: "Twilio", category: "Voice & SMS", description: "Make calls and send texts directly from contact records.", logo: "https://svgl.app/library/twilio.svg" },
  { name: "Notion", category: "Docs", description: "Link Notion pages to deals and embed CRM data in docs.", logo: "https://svgl.app/library/notion.svg" },
  { name: "GitHub", category: "Dev Tools", description: "Track issues and PRs linked to customer accounts.", logo: "https://cdn.simpleicons.org/github/141414" },
  { name: "Shopify", category: "E-Commerce", description: "Import customer orders and sync purchase history.", logo: "https://svgl.app/library/shopify.svg" },
  { name: "HubSpot", category: "Migration", description: "One-click import of contacts, deals, and pipelines.", logo: "https://cdn.simpleicons.org/hubspot/141414" },
  { name: "Salesforce", category: "Migration", description: "Migrate your entire Salesforce org in minutes.", logo: "https://svgl.app/library/salesforce.svg" },
  { name: "Zoom", category: "Video", description: "Auto-log Zoom meetings and record call summaries.", logo: "https://svgl.app/library/zoom.svg" },
  { name: "Mailchimp", category: "Marketing", description: "Sync segments and trigger email campaigns from CRM.", logo: "https://cdn.simpleicons.org/mailchimp/141414" },
  { name: "Google Sheets", category: "Spreadsheets", description: "Export contacts and reports to Sheets automatically.", logo: "https://svgl.app/library/google-sheets.svg" },
  { name: "Intercom", category: "Support", description: "View live chat history and support tickets on contacts.", logo: "https://cdn.simpleicons.org/intercom/141414" },
  { name: "Figma", category: "Design", description: "Embed design previews in deal notes and proposals.", logo: "https://svgl.app/library/figma.svg" },
  { name: "Linear", category: "Project Mgmt", description: "Link customer requests to Linear issues and roadmap.", logo: "https://svgl.app/library/linear.svg" },
  { name: "Vercel", category: "Hosting", description: "Monitor deployment status for customer-facing projects.", logo: "https://cdn.simpleicons.org/vercel/141414" },
  { name: "OpenAI", category: "AI", description: "AI-powered contact summaries and email drafting.", logo: "https://cdn.simpleicons.org/openai" },
  { name: "PostgreSQL", category: "Database", description: "Direct database sync for custom reporting pipelines.", logo: "https://svgl.app/library/postgresql.svg" },
];

const TOTAL = INTEGRATIONS.length;
const MAX_SCROLL = 2000;

const lerpFn = (a: number, b: number, t: number) => a + (b - a) * t;

// --- Main Component ---
export default function ScrollMorphHero() {
  const [phase, setPhase] = useState<AnimationPhase>("scatter");
  const [size, setSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);

  // --- Resize ---
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ width: e.contentRect.width, height: e.contentRect.height }));
    ro.observe(el);
    setSize({ width: el.offsetWidth, height: el.offsetHeight });
    return () => ro.disconnect();
  }, []);

  // --- Direct scroll (no momentum, no lerp) ---
  const scrollVal = useMotionValue(0);
  const scrollPos = useRef(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>();

  const applyScroll = useCallback((delta: number) => {
    const prev = scrollPos.current;
    scrollPos.current = Math.max(0, Math.min(prev + delta, MAX_SCROLL));
    scrollVal.set(scrollPos.current);

    // Mark as scrolling, clear after 100ms of no input
    setIsScrolling(true);
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => setIsScrolling(false), 100);

    // Mark done — dismiss overlay after a short fade
    if (scrollPos.current >= MAX_SCROLL && !doneRef.current) {
      doneRef.current = true;
      setTimeout(() => {
        window.dispatchEvent(new Event("morph-done"));
      }, 500);
    }
  }, [scrollVal]);

  // --- Wheel handler ---
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (doneRef.current && e.deltaY > 0) return;
      if (scrollPos.current <= 0 && e.deltaY < 0) return;

      if (doneRef.current && e.deltaY < 0) {
        const rect = el.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight * 0.5) {
          doneRef.current = false;
        } else {
          return;
        }
      }

      e.preventDefault();
      applyScroll(e.deltaY);
    };

    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => {
      const dy = touchY - e.touches[0].clientY;
      touchY = e.touches[0].clientY;
      if (doneRef.current && dy > 0) return;
      if (scrollPos.current <= 0 && dy < 0) return;
      if (doneRef.current && dy < 0) doneRef.current = false;
      e.preventDefault();
      applyScroll(dy * 2);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [applyScroll]);

  // --- Derived values (no springs — instant response) ---
  const morph = useTransform(scrollVal, [0, 800], [0, 1]);
  const rotate = useTransform(scrollVal, [800, MAX_SCROLL], [0, 360]);

  const mouseX = useMotionValue(0);
  const mouseSmooth = useSpring(mouseX, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mouseX.set(((e.clientX - rect.left) / rect.width * 2 - 1) * 80);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, [mouseX]);

  // --- Intro sequence ---
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("line"), 500);
    const t2 = setTimeout(() => setPhase("circle"), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // --- Scatter positions ---
  const scatter = useMemo(() =>
    INTEGRATIONS.map(() => ({
      x: (Math.random() - 0.5) * 1500,
      y: (Math.random() - 0.5) * 1000,
      rotation: (Math.random() - 0.5) * 180,
      scale: 0.6,
      opacity: 0,
    })), []);

  // --- Subscribe to motion values for render ---
  const [mv, setMv] = useState(0);
  const [rv, setRv] = useState(0);
  const [px, setPx] = useState(0);

  useEffect(() => {
    const u1 = morph.on("change", setMv);
    const u2 = rotate.on("change", setRv);
    const u3 = mouseSmooth.on("change", setPx);
    return () => { u1(); u2(); u3(); };
  }, [morph, rotate, mouseSmooth]);

  // --- Fade out only at the very end of the full scroll range ---
  const sectionOpacity = useTransform(scrollVal, [MAX_SCROLL * 0.85, MAX_SCROLL], [1, 0]);

  // --- Compute card targets ---
  const getTarget = useCallback((i: number) => {
    if (phase === "scatter") return scatter[i];
    if (phase === "line") {
      const spacing = 70;
      return { x: i * spacing - TOTAL * spacing / 2, y: 0, rotation: 0, scale: 1, opacity: 1 };
    }

    const mobile = size.width < 768;
    const minDim = Math.min(size.width, size.height);
    const cRadius = Math.min(minDim * 0.35, 350);
    const cAngle = (i / TOTAL) * 360;
    const cRad = cAngle * Math.PI / 180;
    const cPos = { x: Math.cos(cRad) * cRadius, y: Math.sin(cRad) * cRadius, rot: cAngle + 90 };

    const base = Math.min(size.width, size.height * 1.5);
    const aRadius = base * (mobile ? 1.4 : 1.1);
    const aApex = size.height * (mobile ? 0.35 : 0.25);
    const aCenterY = aApex + aRadius;
    const spread = mobile ? 100 : 130;
    const start = -90 - spread / 2;
    const step = spread / (TOTAL - 1);

    const prog = Math.min(Math.max(rv / 360, 0), 1);
    const bounded = -prog * spread * 0.8;
    const aAngle = start + i * step + bounded;
    const aRad = aAngle * Math.PI / 180;

    const aPos = {
      x: Math.cos(aRad) * aRadius + px,
      y: Math.sin(aRad) * aRadius + aCenterY,
      rot: aAngle + 90,
      scale: mobile ? 1.4 : 1.8,
    };

    return {
      x: lerpFn(cPos.x, aPos.x, mv),
      y: lerpFn(cPos.y, aPos.y, mv),
      rotation: lerpFn(cPos.rot, aPos.rot, mv),
      scale: lerpFn(1, aPos.scale, mv),
      opacity: 1,
    };
  }, [phase, scatter, size, mv, rv, px]);

  return (
    <motion.div
      ref={containerRef}
      style={{ opacity: sectionOpacity }}
      className="relative w-full h-full bg-background overflow-hidden"
    >
      <div className="flex h-full w-full flex-col items-center justify-center">
        {/* Center text — fades as morph begins */}
        <div className="absolute z-30 flex flex-col items-center justify-center text-center pointer-events-none top-1/2 -translate-y-1/2 px-6">
          <motion.h1
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={
              phase === "circle" && mv < 0.3
                ? { opacity: 1 - mv * 3, y: 0, filter: "blur(0px)" }
                : { opacity: 0, filter: "blur(10px)" }
            }
            transition={{ duration: 0.8 }}
            className="text-2xl font-medium tracking-tight text-[#141414] dark:text-[#F5F5F5] md:text-4xl"
            style={{ letterSpacing: "-0.4px" }}
          >
            Built for teams that move fast.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={phase === "circle" && mv < 0.3 ? { opacity: 0.5 - mv * 1.5 } : { opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="mt-4 text-xs font-medium tracking-[0.2em] text-[#707070] uppercase"
          >
            Scroll to explore
          </motion.p>
        </div>

        {/* Cards */}
        <div className="relative flex items-center justify-center w-full h-full">
          {INTEGRATIONS.map((integration, i) => (
            <FlipCard
              key={i}
              integration={integration}
              index={i}
              total={TOTAL}
              phase={phase}
              isScrolling={isScrolling}
              target={getTarget(i)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
