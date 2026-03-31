import { Navbar } from "@/components/landing/navbar";
import { ScrollIntro } from "@/components/landing/scroll-intro";
import { HeroSection } from "@/components/landing/hero-section";
import { Features } from "@/components/landing/features";
import { LogoBurst } from "@/components/landing/logo-burst";
import { Testimonials } from "@/components/landing/testimonials";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Fixed overlay — disappears when animation completes */}
      <ScrollIntro />

      {/* Main landing page (always in DOM, behind overlay until it clears) */}
      <Navbar />
      <HeroSection />
      <Features />
      <LogoBurst />
      <Testimonials />
      <CtaSection />
      <Footer />
    </main>
  );
}
