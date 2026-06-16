import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Radar, Orbit } from "lucide-react";

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-16 text-center">
      {/* Hero background image */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/images/neo-hero.png"
          alt="A near-Earth asteroid drifting through deep space toward Earth"
          className="h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      </div>

      <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-medium tracking-widest text-primary uppercase">
        <Radar className="h-3.5 w-3.5" />
        Near-Earth Object Threat Analysis
      </div>

      <h1 className="mt-6 max-w-4xl font-heading text-4xl font-bold tracking-tight text-balance sm:text-6xl lg:text-7xl">
        Forecast & Simulate{" "}
        <span className="text-primary">NEO Collisions</span> in 3D
      </h1>

      <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">
        An interactive research platform for predicting near-Earth object
        impact trajectories and visualizing collision scenarios in a fully
        rendered three-dimensional space environment.
      </p>

      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
        <Button
          asChild
          size="lg"
          className="group h-12 px-8 text-base font-semibold"
        >
          <Link href="/simulation">
            Enter Simulation
            <ArrowRight className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-12 border-border/60 bg-card/30 px-8 text-base backdrop-blur-sm"
        >
          <Link href="#mission">
            <Orbit className="mr-1 h-5 w-5" />
            Explore the Mission
          </Link>
        </Button>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs tracking-widest text-muted-foreground/70 uppercase">
        Scroll to discover
      </div>
    </section>
  );
}
