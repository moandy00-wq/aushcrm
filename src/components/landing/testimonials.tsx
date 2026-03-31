"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useState } from "react";

const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "VP of Sales",
    company: "Meridian Corp",
    quote: "We cut our onboarding time in half. New reps only see their own contacts — no confusion, no clutter.",
    initials: "SC",
    size: "tall" as const,
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
  },
  {
    name: "James Okonkwo",
    role: "Revenue Operations",
    company: "Lattice",
    quote: "The analytics dashboard gives me a real-time view of the whole pipeline. CSV export saves us hours.",
    initials: "JO",
    size: "square" as const,
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  },
  {
    name: "Maria Torres",
    role: "Account Executive",
    company: "Basecamp",
    quote: "Finally a CRM that doesn't fight you. Logging calls and meetings takes two clicks.",
    initials: "MT",
    size: "wide" as const,
    img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
  },
  {
    name: "Alex Kim",
    role: "Head of Growth",
    company: "Vercel",
    quote: "Role-based access was a game changer. Our team finally has clarity on who owns what.",
    initials: "AK",
    size: "square" as const,
    img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80",
  },
  {
    name: "Priya Sharma",
    role: "Founder",
    company: "Cohort Labs",
    quote: "Imported 12,000 contacts from HubSpot in under a minute. The migration was painless.",
    initials: "PS",
    size: "tall" as const,
    img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
  },
  {
    name: "David Park",
    role: "Sales Manager",
    company: "Linear",
    quote: "The interaction timeline is brilliant. Nothing slips through the cracks anymore.",
    initials: "DP",
    size: "wide" as const,
    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
  },
];

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: (typeof TESTIMONIALS)[0];
  index: number;
}) {
  const [hovering, setHovering] = useState(false);

  // Grid span classes based on size
  const sizeClasses = {
    tall: "row-span-2",
    square: "row-span-1",
    wide: "col-span-2 row-span-1",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className={`group relative overflow-hidden rounded-sm ${sizeClasses[testimonial.size]}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={testimonial.img}
          alt={testimonial.name}
          className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ scale: hovering ? 1.1 : 1, opacity: hovering ? 1 : 0.7 }}
          transition={{ duration: 0.2 }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/20"
        >
          <Play className="h-5 w-5 text-white fill-white ml-0.5" />
        </motion.div>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        {/* Quote — shows on hover */}
        <motion.p
          animate={{ opacity: hovering ? 1 : 0, y: hovering ? 0 : 8 }}
          transition={{ duration: 0.25 }}
          className="text-xs text-white/80 leading-relaxed mb-3"
        >
          &ldquo;{testimonial.quote}&rdquo;
        </motion.p>

        {/* Name + role */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-[9px] font-semibold text-white border border-white/10">
            {testimonial.initials}
          </div>
          <div>
            <p className="text-xs font-medium text-white leading-none">{testimonial.name}</p>
            <p className="text-[10px] text-white/60 mt-0.5">
              {testimonial.role}, {testimonial.company}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Testimonials() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#A0A0A0]">
            Wall of love
          </p>
          <h2
            className="text-[#141414] dark:text-[#F5F5F5]"
            style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 600, letterSpacing: "-0.4px", lineHeight: 1.1 }}
          >
            Loved by teams everywhere
          </h2>
          <p className="mt-4 text-sm text-[#707070] md:text-base">
            Real people. Real results. Hear from teams using AushCRM every day.
          </p>
        </div>

        {/* Masonry grid */}
        <div className="grid auto-rows-[180px] grid-cols-2 gap-3 md:grid-cols-3 lg:auto-rows-[200px]">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={t.name} testimonial={t} index={i} />
          ))}
        </div>

        {/* Bottom note */}
        <p className="mt-8 text-center text-xs text-[#A0A0A0]">
          Video testimonials powered by AI · Replace with your own Higgsfield UGC clips
        </p>
      </div>
    </section>
  );
}
