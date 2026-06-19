import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAsteroids, type AsteroidDetail } from "@/contexts/AsteroidContext";
import { X, Orbit, AlertTriangle, Ruler, Palette } from "lucide-react";
import * as THREE from "three";

interface AsteroidControlsProps {
  selectedAsteroid: AsteroidDetail | null;
  setFlyTarget: (
    target: { obj: THREE.Object3D; radius: number } | null,
  ) => void;
  setResetCamera: (reset: boolean) => void;
}

const ORBITAL_LABELS: Record<keyof AsteroidDetail["orbital_elements"], string> =
  {
    a_au: "Semi-major axis",
    e: "Eccentricity",
    i_deg: "Inclination",
    Omega_deg: "Long. asc. node",
    omega_deg: "Arg. perihelion",
    epoch_jd: "Epoch (JD)",
  };

export function AsteroidControls({
  selectedAsteroid,
  setFlyTarget,
  setResetCamera,
}: AsteroidControlsProps) {
  const { selectAsteroid } = useAsteroids();

  if (!selectedAsteroid) return null;

  const handleClear = () => {
    setFlyTarget(null);
    selectAsteroid(null);
    setResetCamera(true);
  };

  const { name, type, pha, diameter_km, color, orbital_elements } =
    selectedAsteroid;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="default" size="sm" className="gap-2">
          <Orbit className="h-4 w-4" />
          <span className="max-w-48 truncate">{name}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-80 border bg-card/70 backdrop-blur-md p-0 text-card-foreground shadow-lg"
      >
        <div className="flex items-start justify-between gap-3 border-b bg-muted/50 p-4">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold leading-tight">
              {name}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="text-xs">
                {type}
              </Badge>
              {pha && (
                <Badge variant="destructive" className="gap-1 text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  PHA
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={handleClear}
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-background/50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Ruler className="h-3.5 w-3.5" />
                  Diameter
                </div>
                <div className="mt-1 text-sm font-medium tabular-nums">
                  {diameter_km !== null ? `${diameter_km.toFixed(3)} km` : "—"}
                </div>
              </div>
              <div className="rounded-lg border bg-background/50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Palette className="h-3.5 w-3.5" />
                  Color
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm font-medium">
                  <span
                    className="inline-block h-3.5 w-3.5 rounded-full border"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
                  <span className="truncate uppercase">{color}</span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Orbital elements
              </h4>
              <dl className="space-y-2">
                {(
                  Object.keys(ORBITAL_LABELS) as Array<
                    keyof typeof ORBITAL_LABELS
                  >
                ).map((key) => (
                  <div
                    key={key}
                    className="flex items-center justify-between text-sm"
                  >
                    <dt className="text-muted-foreground">
                      {ORBITAL_LABELS[key]}
                    </dt>
                    <dd className="font-mono font-medium tabular-nums">
                      {orbital_elements[key].toLocaleString(undefined, {
                        maximumFractionDigits: 4,
                      })}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-md bg-muted p-2">
                <div className="text-muted-foreground">Samples</div>
                <div className="mt-0.5 font-mono font-medium">
                  {selectedAsteroid.positions.x.length}
                </div>
              </div>
              <div className="rounded-md bg-muted p-2">
                <div className="text-muted-foreground">PHA</div>
                <div className="mt-0.5 font-medium">{pha ? "Yes" : "No"}</div>
              </div>
              <div className="rounded-md bg-muted p-2">
                <div className="text-muted-foreground">Class</div>
                <div className="mt-0.5 truncate font-medium">{type}</div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="border-t bg-muted/50 p-3">
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={handleClear}
          >
            Remove from scene
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default AsteroidControls;
