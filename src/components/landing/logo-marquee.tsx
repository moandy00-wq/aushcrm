"use client";

import { LOGO_LIST } from "@/components/icons/logos";
import { BlurredInfiniteSlider } from "@/components/ui/infinite-slider";

export function LogoMarquee() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center gap-8 md:flex-row md:gap-12">
          <div className="flex shrink-0 items-center gap-6">
            <p className="text-sm font-medium text-[#707070] whitespace-nowrap">
              Trusted by teams at
            </p>
            <div className="hidden h-8 w-px bg-black/[0.06] dark:bg-white/[0.06] md:block" />
          </div>

          <BlurredInfiniteSlider
            className="flex-1 w-full"
            gap={48}
            speed={60}
          >
            {LOGO_LIST.map(({ name, Icon }) => (
              <div
                key={name}
                className="flex items-center justify-center px-2"
              >
                <Icon
                  className="h-5 w-auto opacity-40 grayscale dark:invert md:h-7"
                  aria-label={name}
                />
              </div>
            ))}
          </BlurredInfiniteSlider>
        </div>
      </div>
    </section>
  );
}
