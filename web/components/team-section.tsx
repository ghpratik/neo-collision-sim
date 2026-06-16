import { team } from "@/lib/team";

export function TeamSection() {
  return (
    <section id="team" className="relative px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="text-xs font-medium tracking-widest text-primary uppercase">
            The Crew
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Meet the Team
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-muted-foreground text-pretty">
            The minds behind the NEO Collision Simulator.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member) => (
            <div
              key={member.name}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-6 text-center transition-colors hover:border-primary/50"
            >
              <div className="absolute -top-12 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-primary/20 blur-2xl transition-opacity group-hover:opacity-100 opacity-50" />
              <div className="relative mx-auto flex h-40 w-40 items-center justify-center rounded-full border border-primary/40 bg-primary/10 font-heading text-xl font-bold text-primary">
                {member.initials}
              </div>
              <h3 className="mt-5 font-heading text-lg font-semibold">
                {member.name}
              </h3>
              <p className="mt-1 text-sm font-medium text-primary">
                {member.role}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {member.focus}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
