"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const LOGOS = [
  { name: "Slack", logo: "https://svgl.app/library/slack.svg", bg: "#4A154B" },
  { name: "Gmail", logo: "https://svgl.app/library/gmail.svg", bg: "#EA4335" },
  { name: "Stripe", logo: "https://svgl.app/library/stripe.svg", bg: "#635BFF" },
  { name: "Notion", logo: "https://svgl.app/library/notion.svg", bg: "#191919" },
  { name: "Figma", logo: "https://svgl.app/library/figma.svg", bg: "#F24E1E" },
  { name: "Linear", logo: "https://svgl.app/library/linear.svg", bg: "#5E6AD2" },
  { name: "Shopify", logo: "https://svgl.app/library/shopify.svg", bg: "#96BF48" },
  { name: "Salesforce", logo: "https://svgl.app/library/salesforce.svg", bg: "#00A1E0" },
  { name: "GitHub", logo: "https://cdn.simpleicons.org/github/ffffff", bg: "#24292F" },
  { name: "Zoom", logo: "https://svgl.app/library/zoom.svg", bg: "#2D8CFF" },
  { name: "Twilio", logo: "https://svgl.app/library/twilio.svg", bg: "#F22F46" },
  { name: "HubSpot", logo: "https://cdn.simpleicons.org/hubspot/ffffff", bg: "#FF7A59" },
  { name: "Zapier", logo: "https://cdn.simpleicons.org/zapier/ffffff", bg: "#FF4A00" },
  { name: "OpenAI", logo: "https://cdn.simpleicons.org/openai/ffffff", bg: "#10A37F" },
  { name: "Vercel", logo: "https://cdn.simpleicons.org/vercel/ffffff", bg: "#000000" },
  { name: "Intercom", logo: "https://cdn.simpleicons.org/intercom/ffffff", bg: "#1F8DED" },
];

// Pre-compute final scattered positions — wide radial burst
// Two even rings — inner ring of 8, outer ring of 8
const SCATTERED = LOGOS.map((_, i) => {
  const isOuter = i >= 8;
  const ringIndex = isOuter ? i - 8 : i;
  const ringCount = 8;
  const angle = (ringIndex / ringCount) * Math.PI * 2 + (isOuter ? Math.PI / 8 : 0); // offset outer ring by half step
  const radius = isOuter ? 420 : 240;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius * 0.55,
    rotate: (Math.random() - 0.5) * 20,
    floatDuration: 5 + Math.random() * 3,
    floatDelay: Math.random() * 3,
  };
});

// Tight cluster start positions — all very close to center
const CLUSTER = LOGOS.map((_, i) => {
  const angle = (i / LOGOS.length) * Math.PI * 2;
  const r = 8 + Math.random() * 12;
  return {
    x: Math.cos(angle) * r,
    y: Math.sin(angle) * r,
    rotate: (Math.random() - 0.5) * 180,
  };
});

function BurstLogo({
  logo,
  name,
  bg,
  index,
  exploded,
}: {
  logo: string;
  name: string;
  bg: string;
  index: number;
  exploded: boolean;
}) {
  const cluster = CLUSTER[index];
  const scattered = SCATTERED[index];

  return (
    <motion.div
      className="absolute"
      initial={{
        x: cluster.x,
        y: cluster.y,
        rotate: cluster.rotate,
        scale: 0.4,
        opacity: 0.6,
      }}
      animate={
        exploded
          ? {
              x: scattered.x,
              y: scattered.y,
              rotate: scattered.rotate,
              scale: 1,
              opacity: 1,
            }
          : {
              x: cluster.x,
              y: cluster.y,
              rotate: cluster.rotate,
              scale: 0.4,
              opacity: 0.6,
            }
      }
      transition={{
        type: "spring",
        stiffness: 120,
        damping: 10,
        mass: 0.6,
        delay: exploded ? index * 0.02 : 0,
      }}
    >
      {/* Floating hover animation — only active after explosion */}
      <motion.div
        animate={
          exploded
            ? {
                y: [0, -10, 0, 8, 0],
                x: [0, 6, 0, -5, 0],
                rotate: [0, 3, 0, -3, 0],
              }
            : {}
        }
        transition={{
          duration: scattered.floatDuration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: scattered.floatDelay + 0.8, // start floating after burst settles
        }}
        className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl"
        style={{ backgroundColor: bg, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={name} className="h-9 w-9 object-contain" style={{ filter: "brightness(0) invert(1)" }} />
      </motion.div>
    </motion.div>
  );
}

export function LogoBurst() {
  const triggerRef = useRef<HTMLDivElement>(null);
  // Trigger when 60% of the section is visible — the sweet spot
  const isInView = useInView(triggerRef, { once: false, amount: 0.6 });

  return (
    <section className="relative overflow-hidden pt-20 pb-8">
      {/* Text — positioned well above the burst */}
      <motion.div
        className="text-center mb-16 relative z-10"
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A0A0A0] mb-3">
          Seamless integrations
        </p>
        <h2
          className="text-[#141414] dark:text-[#F5F5F5]"
          style={{
            fontSize: "clamp(24px, 3.5vw, 40px)",
            fontWeight: 600,
            letterSpacing: "-0.3px",
            lineHeight: 1.1,
          }}
        >
          Connects with the tools
          <br />
          you already use
        </h2>
      </motion.div>

      {/* Burst area — lots of vertical space for the explosion */}
      <div
        ref={triggerRef}
        className="relative flex items-center justify-center"
        style={{ height: 550 }}
      >
        {LOGOS.map((logo, i) => (
          <BurstLogo
            key={logo.name}
            logo={logo.logo}
            name={logo.name}
            bg={logo.bg}
            index={i}
            exploded={isInView}
          />
        ))}
      </div>
    </section>
  );
}
