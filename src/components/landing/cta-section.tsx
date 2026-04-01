"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import BoxLoader from "@/components/ui/box-loader";

export function CtaSection() {
  return (
    <section
      className="relative overflow-hidden bg-[#F5F5F5] dark:bg-[#141414]"
      style={{ "--cta-bg": "#F5F5F5" } as React.CSSProperties}
      data-cta
    >
      {/* Top divider */}
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 pt-8">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-black/[0.06] to-transparent dark:via-white/[0.06]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#A0A0A0]">
          Get started
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-black/[0.06] to-transparent dark:via-white/[0.06]" />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Left — 3D Box Animation (hidden on mobile) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="hidden lg:flex items-center justify-center overflow-hidden"
          >
            <div className="relative flex items-center justify-center" style={{ width: 280, height: 350 }}>
              <div style={{ transform: "scale(0.85)" }}>
                <BoxLoader maskColor="var(--cta-bg)" />
              </div>
            </div>
          </motion.div>

          {/* Right — CTA content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col items-center text-center lg:items-start lg:text-left"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#A0A0A0]">
              Start building today
            </p>

            <h2
              className="text-[#141414] dark:text-[#F5F5F5]"
              style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 600,
                letterSpacing: "-0.4px",
                lineHeight: 1.1,
              }}
            >
              Ready to build
              <br />
              something great?
            </h2>

            <p className="mt-4 text-sm text-[#707070] leading-relaxed md:text-base max-w-md">
              Everything you need to manage contacts, track interactions, and grow your pipeline. Start free, no credit card required.
            </p>

            {/* Feature checklist */}
            <ul className="mt-6 flex flex-col gap-2.5">
              {[
                "Unlimited contacts on free tier",
                "Role-based access out of the box",
                "Import from HubSpot, Salesforce, CSV",
                "Up and running in under 2 minutes",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 text-sm text-[#141414] dark:text-[#F5F5F5]"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#141414] dark:bg-[#F5F5F5]">
                    <svg
                      className="h-2.5 w-2.5 text-white dark:text-[#141414]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/interview"
                className="inline-flex items-center gap-2 rounded-full bg-[#141414] px-6 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#141414]/90 dark:bg-[#F5F5F5] dark:text-[#141414] dark:hover:bg-[#F5F5F5]/90"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#demo"
                className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] px-6 py-3 text-sm font-medium text-[#141414] transition-colors duration-150 hover:border-black/[0.16] dark:border-white/[0.08] dark:text-[#F5F5F5] dark:hover:border-white/[0.16]"
              >
                Book a Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
