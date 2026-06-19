"use client";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAsteroids } from "@/contexts/AsteroidContext";

const AsteroidsSheet = () => {
  const {
    asteroids,
    loading,
    loadingMore,
    hasMore,
    total,
    search,
    setSearch,
    loadMore,
    selectedAsteroidId,
    selectAsteroid,
  } = useAsteroids();

  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // infinite scroll: observe a sentinel div at the bottom of the list
  useEffect(() => {
    const root = scrollRef.current;
    const target = sentinelRef.current;
    if (!root || !target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { root, rootMargin: "200px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="z-10 bg-background/10 backdrop-blur-sm"
          size="sm"
        >
          View Asteroids
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-background/30 backdrop-blur-sm flex flex-col">
        <SheetHeader>
          <SheetTitle>All Asteroids</SheetTitle>
          <SheetDescription>
            List of all asteroids ranked by predicted collision risk. Click an
            asteroid to focus on it.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4">
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e: { target: { value: string } }) =>
              setSearch(e.target.value)
            }
            className="bg-card/30"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {total} asteroid{total === 1 ? "" : "s"} found
          </p>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto h-[65vh] mt-2">
          <div className="grid auto-rows-min gap-4 px-4 pb-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : asteroids.length ? (
              <>
                {asteroids.map(({ id, name, diameter_km, pha, risk_score }) => (
                  <SheetClose asChild key={id}>
                    <button
                      onClick={() => selectAsteroid(id)}
                      className={`border p-4 text-left rounded-md transition-colors hover:bg-muted ${
                        selectedAsteroidId === id
                          ? "border-primary bg-muted"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medium">{name}</h3>
                        <span className="text-xs font-mono text-muted-foreground shrink-0">
                          risk {risk_score.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Diameter: {diameter_km ?? "~1"} km
                      </p>
                      {pha && (
                        <p className="text-xs text-red-500">
                          Potentially Hazardous
                        </p>
                      )}
                    </button>
                  </SheetClose>
                ))}

                <div ref={sentinelRef} />

                {loadingMore && (
                  <div className="flex justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}

                {hasMore && !loadingMore && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMore}
                    className="mx-auto"
                  >
                    Load more
                  </Button>
                )}

                {!hasMore && (
                  <p className="text-center text-xs text-muted-foreground py-2">
                    End of list
                  </p>
                )}
              </>
            ) : (
              <p>No asteroids found.</p>
            )}
          </div>
        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline" onClick={() => selectAsteroid(null)}>
              Clear Selection
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default AsteroidsSheet;
