"use client";

import {
  ContainerAnimated,
  ContainerStagger,
} from "@/components/ui/scroll-animation";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CtaSection() {
  return (
    <section className="bg-[#F5F5F5] py-24 dark:bg-[#141414]">
      <ContainerStagger
        stagger={0.12}
        className="mx-auto flex max-w-3xl flex-col items-center text-center px-6"
      >
        <ContainerAnimated animation="blur">
          <h2 className="text-3xl font-semibold text-[#141414] dark:text-[#F5F5F5]">
            Ready to organize your team?
          </h2>
        </ContainerAnimated>

        <ContainerAnimated animation="blur">
          <p className="mt-4 text-[#707070]">
            Start free. No credit card required.
          </p>
        </ContainerAnimated>

        <ContainerAnimated animation="bottom">
          <Link
            href="#get-started"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#141414] px-6 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#141414]/90 dark:bg-[#F5F5F5] dark:text-[#141414] dark:hover:bg-[#F5F5F5]/90"
          >
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </ContainerAnimated>
      </ContainerStagger>
    </section>
  );
}
