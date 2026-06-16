import { Telescope, LineChart, Boxes, ShieldAlert } from "lucide-react";

const stats = [
  { value: "34,000+", label: "Tracked Near-Earth Objects" },
  { value: "2,300+", label: "Potentially Hazardous Asteroids" },
  { value: "150M km", label: "Average Earth-Sun Distance" },
  { value: "< 1 AU", label: "NEO Approach Threshold" },
];

const features = [
  {
    icon: Telescope,
    title: "Orbital Tracking",
    description:
      "Model the orbital paths of near-Earth objects using Keplerian elements and real ephemeris data.",
  },
  {
    icon: LineChart,
    title: "Impact Forecasting",
    description:
      "Estimate collision probability and predicted impact windows across configurable time horizons.",
  },
  {
    icon: Boxes,
    title: "3D Visualization",
    description:
      "Watch trajectories unfold in a real-time three-dimensional scene rendered with React Three Fiber.",
  },
  {
    icon: ShieldAlert,
    title: "Scenario Analysis",
    description:
      "Adjust velocity, mass, and approach angle to explore deflection and worst-case impact outcomes.",
  },
];

export function Mission() {
  return (
    <section id="mission" className="relative px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Stats strip */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/40 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-card/60 p-6 text-center backdrop-blur-sm"
            >
              <div className="font-heading text-2xl font-bold text-primary sm:text-3xl">
                {stat.value}
              </div>
              <div className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Heading */}
        <div className="mt-20 grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="text-xs font-medium tracking-widest text-primary uppercase">
              The Mission
            </span>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Understanding the threat before it arrives
            </h2>
            <p className="mt-5 leading-relaxed text-muted-foreground text-pretty">
              Near-Earth objects pass our planet constantly. While most are
              harmless, a small fraction follow trajectories that warrant close
              observation. This platform combines orbital mechanics with
              interactive 3D simulation to help forecast potential collisions
              and make complex physics tangible.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm transition-colors hover:border-primary/50"
                >
                  <feature.icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-3 font-heading text-base font-semibold">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-4 -z-10 rounded-full bg-primary/10 blur-3xl" />
            <img
              src="/images/orbit-diagram.png"
              alt="Top-down orbital diagram showing an asteroid's predicted collision trajectory crossing Earth's orbit"
              className="w-full rounded-2xl border border-border/60"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
