"use client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const { asteroids, loading, selectedAsteroidId, selectAsteroid } =
    useAsteroids();

  if (loading) return <div>Loading...</div>;

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
      <SheetContent className="bg-background/30 backdrop-blur-sm">
        <SheetHeader>
          <SheetTitle>All Asteroids</SheetTitle>
          <SheetDescription>
            List of all asteroids ranked by probability of collision to the
            Earth. Click on an asteroid to focus on it.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[80vh] w-full">
          <div className="grid flex-1 auto-rows-min gap-4 px-4">
            {asteroids.length ? (
              asteroids.map(({ id, data: asteroid }) => (
                <SheetClose asChild key={id}>
                  <button
                    onClick={() => selectAsteroid(id)}
                    className={`border p-4 text-left rounded-md transition-colors hover:bg-muted ${
                      selectedAsteroidId === id ? "border-primary bg-muted" : ""
                    }`}
                  >
                    <h3 className="font-medium">{asteroid.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Diameter: {asteroid.diameter_km ?? "Unknown"} km
                    </p>
                    {asteroid.pha && (
                      <p className="text-xs text-red-500">
                        Potentially Hazardous
                      </p>
                    )}
                  </button>
                </SheetClose>
              ))
            ) : (
              <p>No asteroids available.</p>
            )}
          </div>
        </ScrollArea>
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
