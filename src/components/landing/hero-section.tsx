"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { InfiniteSlider } from "@/components/ui/infinite-slider";

// --- Integration logos for the belts ---
const ROW_1 = [
  { name: "Slack", logo: "https://svgl.app/library/slack.svg" },
  { name: "Gmail", logo: "https://svgl.app/library/gmail.svg" },
  { name: "Stripe", logo: "https://svgl.app/library/stripe.svg" },
  { name: "Notion", logo: "https://svgl.app/library/notion.svg" },
  { name: "Figma", logo: "https://svgl.app/library/figma.svg" },
  { name: "Linear", logo: "https://svgl.app/library/linear.svg" },
  { name: "Shopify", logo: "https://svgl.app/library/shopify.svg" },
  { name: "Salesforce", logo: "https://svgl.app/library/salesforce.svg" },
  { name: "Google Calendar", logo: "https://svgl.app/library/google-calendar.svg" },
  { name: "Google Sheets", logo: "https://svgl.app/library/google-sheets.svg" },
];

const ROW_2 = [
  { name: "GitHub", logo: "https://cdn.simpleicons.org/github/141414" },
  { name: "Zoom", logo: "https://svgl.app/library/zoom.svg" },
  { name: "Twilio", logo: "https://svgl.app/library/twilio.svg" },
  { name: "HubSpot", logo: "https://cdn.simpleicons.org/hubspot/141414" },
  { name: "Zapier", logo: "https://cdn.simpleicons.org/zapier/141414" },
  { name: "OpenAI", logo: "https://cdn.simpleicons.org/openai/141414" },
  { name: "Vercel", logo: "https://cdn.simpleicons.org/vercel/141414" },
  { name: "Intercom", logo: "https://cdn.simpleicons.org/intercom/141414" },
  { name: "Mailchimp", logo: "https://cdn.simpleicons.org/mailchimp/141414" },
  { name: "PostgreSQL", logo: "https://svgl.app/library/postgresql.svg" },
];

function LogoChip({ name, logo }: { name: string; logo: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-black/[0.06] bg-white px-4 py-2 dark:border-white/[0.06] dark:bg-[#1C1C1C]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo} alt={name} className="h-5 w-5 object-contain" />
      <span className="text-sm font-medium text-[#141414] dark:text-[#F5F5F5] whitespace-nowrap">
        {name}
      </span>
    </div>
  );
}

// --- Dashboard Mockup ---
function DashboardMockup() {
  const contacts = [
    { name: "Sarah Chen", company: "Meridian Corp", status: "Active", email: "sarah@meridian.io" },
    { name: "James Okonkwo", company: "Lattice Inc", status: "Active", email: "james@lattice.com" },
    { name: "Maria Torres", company: "Basecamp", status: "Lead", email: "maria@basecamp.com" },
    { name: "Alex Kim", company: "Vercel", status: "Active", email: "alex@vercel.com" },
    { name: "David Park", company: "Linear", status: "Churned", email: "david@linear.app" },
  ];

  return (
    <div className="w-full overflow-hidden rounded-sm border border-black/[0.06] bg-white dark:border-white/[0.06] dark:bg-[#141414]">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#141414] dark:bg-[#F5F5F5]" />
            <span className="text-xs font-semibold text-[#141414] dark:text-[#F5F5F5]">AushCRM</span>
          </div>
          <span className="text-[10px] text-[#A0A0A0]">/</span>
          <span className="text-xs text-[#707070]">Contacts</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-32 rounded-sm border border-black/[0.06] bg-[#F5F5F5] px-2 flex items-center dark:border-white/[0.06] dark:bg-[#1C1C1C]">
            <span className="text-[10px] text-[#A0A0A0]">Search contacts...</span>
          </div>
          <div className="h-6 rounded-sm bg-[#141414] px-3 flex items-center dark:bg-[#F5F5F5]">
            <span className="text-[10px] font-medium text-white dark:text-[#141414]">+ Add</span>
          </div>
        </div>
      </div>

      {/* Sidebar + Table */}
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden w-40 shrink-0 border-r border-black/[0.06] p-3 dark:border-white/[0.06] md:block">
          {["All Contacts", "My Contacts", "Active", "Leads", "Churned"].map((item, i) => (
            <div
              key={item}
              className={`rounded-sm px-2.5 py-1.5 text-[11px] mb-0.5 ${
                i === 0
                  ? "bg-[#F5F5F5] font-medium text-[#141414] dark:bg-[#1C1C1C] dark:text-[#F5F5F5]"
                  : "text-[#707070] hover:bg-[#F5F5F5] dark:hover:bg-[#1C1C1C]"
              }`}
            >
              {item}
            </div>
          ))}
          <div className="mt-4 border-t border-black/[0.06] pt-3 dark:border-white/[0.06]">
            {["Analytics", "Import CSV", "Settings"].map((item) => (
              <div key={item} className="rounded-sm px-2.5 py-1.5 text-[11px] text-[#707070] mb-0.5">
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-4 gap-2 border-b border-black/[0.06] px-4 py-2 dark:border-white/[0.06]">
            {["Name", "Company", "Email", "Status"].map((h) => (
              <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-[#A0A0A0]">
                {h}
              </span>
            ))}
          </div>
          {/* Rows */}
          {contacts.map((c, i) => (
            <div
              key={i}
              className="grid grid-cols-4 gap-2 border-b border-black/[0.04] px-4 py-2.5 last:border-0 hover:bg-[#F5F5F5]/50 dark:border-white/[0.04] dark:hover:bg-[#1C1C1C]/50"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F5F5F5] text-[8px] font-semibold text-[#141414] dark:bg-[#1C1C1C] dark:text-[#F5F5F5]">
                  {c.name.split(" ").map(n => n[0]).join("")}
                </div>
                <span className="text-[11px] font-medium text-[#141414] dark:text-[#F5F5F5] truncate">{c.name}</span>
              </div>
              <span className="text-[11px] text-[#707070] truncate flex items-center">{c.company}</span>
              <span className="text-[11px] text-[#707070] truncate flex items-center">{c.email}</span>
              <div className="flex items-center">
                <span
                  className={`text-[9px] font-medium px-1.5 py-0.5 rounded-sm ${
                    c.status === "Active"
                      ? "bg-[#F5F5F5] text-[#141414] dark:bg-[#1C1C1C] dark:text-[#F5F5F5]"
                      : c.status === "Lead"
                      ? "bg-[#F5F5F5] text-[#707070] dark:bg-[#1C1C1C] dark:text-[#A0A0A0]"
                      : "bg-[#F5F5F5] text-[#A0A0A0] dark:bg-[#1C1C1C] dark:text-[#505050]"
                  }`}
                >
                  {c.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Dashboard Scroll Expand ---
// Desktop: wheel-driven expand with scroll lock
// Mobile: just show fully expanded (no scroll capture)
function DashboardScrollExpand() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // On mobile, just set progress to 1 (fully expanded)
  useEffect(() => {
    if (isMobile) setProgress(1);
  }, [isMobile]);

  // Desktop only: wheel-driven expand
  useEffect(() => {
    if (isMobile) return;

    const handleWheel = (e: WheelEvent) => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      // Section must be in view
      if (rect.top > window.innerHeight * 0.6 || rect.bottom < 0) return;

      // Scrolling up — free, reset
      if (e.deltaY < 0) {
        if (progress > 0) setProgress(0);
        return;
      }

      // Scrolling down, not fully expanded — lock and expand slowly
      if (e.deltaY > 0 && progress < 1) {
        e.preventDefault();
        e.stopPropagation();
        setProgress((p) => Math.min(p + e.deltaY / 800, 1));
        return;
      }

      // Fully expanded — let page scroll
    };

    window.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    return () => window.removeEventListener("wheel", handleWheel, { capture: true });
  }, [progress, isMobile]);

  // Derived values
  const scale = 0.6 + progress * 0.4;
  const rotateX = 16 - progress * 16;
  const opacity = 0.3 + progress * 0.7;
  const translateY = 80 - progress * 80;
  const radius = 14 - progress * 12;

  return (
    <div ref={sectionRef} className="mx-auto mt-16 max-w-5xl px-6" style={{ perspective: 1200 }}>
      <motion.div
        animate={{ scale, rotateX, opacity, y: translateY, borderRadius: radius }}
        transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
        style={{ transformOrigin: "center bottom" }}
      >
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--background)] to-transparent z-10" />
          <DashboardMockup />
        </div>
      </motion.div>
      {!isMobile && progress > 0.01 && progress < 0.99 && (
        <div className="mt-4 flex justify-center">
          <div className="h-1 w-24 rounded-full bg-[#F5F5F5] dark:bg-[#1C1C1C] overflow-hidden">
            <div
              className="h-full bg-[#141414] dark:bg-[#F5F5F5] rounded-full"
              style={{ width: `${progress * 100}%`, transition: "width 0.1s linear" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// --- Stagger animation variants ---
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};
const item = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5 } },
};

export function HeroSection() {
  return (
    <section id="hero-main" className="relative overflow-hidden pt-28 pb-8">
      {/* Content */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="mx-auto flex max-w-4xl flex-col items-center px-6 text-center"
      >
        {/* Badge */}
        <motion.div variants={item}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/[0.06] px-4 py-1.5 dark:border-white/[0.06]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#141414] dark:bg-[#F5F5F5]" />
            <span className="text-xs font-medium text-[#707070]">
              Connects with 20+ tools
            </span>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={item}
          className="text-[#141414] dark:text-[#F5F5F5]"
          style={{
            fontSize: "clamp(36px, 5.5vw, 72px)",
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: "-0.5px",
          }}
        >
          The CRM your team
          <br />
          actually wants to use.
        </motion.h1>

        {/* Subtitle */}
        <motion.p variants={item} className="mt-5 max-w-xl text-base text-[#707070] leading-relaxed md:text-lg">
          Role-based access, real-time search, and analytics — built for teams that move fast.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={item} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="#get-started"
            className="rounded-full bg-[#141414] px-6 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#141414]/90 dark:bg-[#F5F5F5] dark:text-[#141414] dark:hover:bg-[#F5F5F5]/90"
          >
            Get Started Free
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] px-6 py-3 text-sm font-medium text-[#141414] transition-colors duration-150 hover:border-black/[0.16] dark:border-white/[0.08] dark:text-[#F5F5F5] dark:hover:border-white/[0.16]"
          >
            See How It Works
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </motion.div>

      {/* Logo Belts */}
      <div className="mt-16 space-y-3">
        {/* Label */}
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-[#A0A0A0] mb-4">
          Integrates with the tools you already use
        </p>

        {/* Row 1 — right to left */}
        <div
          className="relative"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          }}
        >
          <InfiniteSlider gap={12} speed={35} reverse>
            {ROW_1.map((item) => (
              <LogoChip key={item.name} {...item} />
            ))}
          </InfiniteSlider>
        </div>

        {/* Row 2 — left to right */}
        <div
          className="relative"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          }}
        >
          <InfiniteSlider gap={12} speed={35}>
            {ROW_2.map((item) => (
              <LogoChip key={item.name} {...item} />
            ))}
          </InfiniteSlider>
        </div>
      </div>

      {/* Dashboard Mockup — scroll-driven expand */}
      <DashboardScrollExpand />
    </section>
  );
}
