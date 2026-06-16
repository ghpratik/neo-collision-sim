import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Globe2 } from "lucide-react";

export function SiteNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/40 bg-primary/10">
            <Globe2 className="h-5 w-5 text-primary" />
          </span>
          <span className="font-heading text-sm font-bold tracking-wide">
            NEO<span className="text-primary">SIM</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground sm:flex">
          <Link href="#mission" className="transition-colors hover:text-foreground">
            Mission
          </Link>
          <Link href="#team" className="transition-colors hover:text-foreground">
            Team
          </Link>
        </nav>

        <Button asChild size="sm" className="font-semibold">
          <Link href="/simulation">Launch</Link>
        </Button>
      </div>
    </header>
  );
}
