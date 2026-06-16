import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CtaFooter() {
  return (
    <footer className="relative px-6 pb-12">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-primary/30 bg-primary/10 px-8 py-16 text-center">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Ready to run a collision scenario?
        </h2>
        <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted-foreground text-pretty">
          Step into the 3D environment and watch near-Earth object trajectories
          play out in real time.
        </p>
        <Button
          asChild
          size="lg"
          className="group mt-8 h-12 px-8 text-base font-semibold"
        >
          <Link href="/simulation">
            Enter Simulation
            <ArrowRight className="ml-1 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground/70">
        NEO Collision Simulator &mdash; Academic Simulation and Forecasting
        Project
      </p>
    </footer>
  );
}
