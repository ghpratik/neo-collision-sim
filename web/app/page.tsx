import { Starfield } from "@/components/starfield";
import { SiteNav } from "@/components/site-nav";
import { Hero } from "@/components/hero";
import { Mission } from "@/components/mission";
import { TeamSection } from "@/components/team-section";
import { CtaFooter } from "@/components/cta-footer";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <Starfield />
      <SiteNav />
      <Hero />
      <Mission />
      <TeamSection />
      <CtaFooter />
    </main>
  );
}
