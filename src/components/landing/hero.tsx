"use client";

import {
  ContainerAnimated,
  ContainerInset,
  ContainerStagger,
} from "@/components/ui/scroll-animation";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-24 pb-16">
      <ContainerStagger
        stagger={0.15}
        className="flex flex-col items-center text-center"
      >
        {/* Eyebrow pill */}
        <ContainerAnimated animation="blur">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/[0.06] px-4 py-1.5 dark:border-white/[0.06]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#141414] dark:bg-[#F5F5F5]" />
            <span className="text-xs font-medium text-[#707070]">
              Now in Beta
            </span>
            <ArrowRight className="h-3 w-3 text-[#707070]" />
          </div>
        </ContainerAnimated>

        {/* Heading */}
        <ContainerAnimated animation="top">
          <h1
            className="max-w-4xl text-[#141414] dark:text-[#F5F5F5]"
            style={{
              fontSize: "clamp(40px, 6vw, 80px)",
              fontWeight: 650,
              lineHeight: 1,
              letterSpacing: "-0.6px",
            }}
          >
            The CRM your team actually wants to use.
          </h1>
        </ContainerAnimated>

        {/* Subtitle */}
        <ContainerAnimated animation="blur">
          <p className="mt-6 max-w-2xl text-xl text-[#707070]">
            Role-based access, real-time search, and analytics — built for teams
            that move fast.
          </p>
        </ContainerAnimated>

        {/* CTAs */}
        <ContainerAnimated animation="bottom">
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="#get-started"
              className="rounded-full bg-[#141414] px-6 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#141414]/90 dark:bg-white dark:text-[#141414] dark:hover:bg-white/90"
            >
              Get Started Free
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-[#141414]/10 px-6 py-3 text-sm font-medium text-[#141414] transition-colors duration-150 hover:border-[#141414]/20 dark:border-white/10 dark:text-[#F5F5F5] dark:hover:border-white/20"
            >
              See How It Works
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </ContainerAnimated>
      </ContainerStagger>

      {/* Product screenshot mockup */}
      <div className="mt-16 w-full max-w-4xl">
        <ContainerInset>
          <div className="flex aspect-video w-full items-center justify-center rounded-sm bg-[#F5F5F5] text-sm font-medium text-[#707070] dark:bg-[#141414]">
            Dashboard Preview
          </div>
        </ContainerInset>
      </div>
    </section>
  );
}
