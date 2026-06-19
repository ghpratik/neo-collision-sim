"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { SelectPlanet } from "@/components/simulation/controls/SelectPlanetDropdown";
import { EARTH, MOON, PLANETS, SUN } from "@/lib/simulation/data";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Scan, X } from "lucide-react";
import Scene from "@/components/simulation/Scene";
import AsteroidsSheet from "@/components/simulation/controls/AsteroidsSheet";
import { useAsteroids } from "@/contexts/AsteroidContext";
import AsteroidControls from "@/components/simulation/controls/AsteroidControls";

const BODY_NAMES = [
  SUN.name,
  EARTH.name,
  MOON.name,
  ...PLANETS.map((p) => p.name),
];

export default function SolarSystemSimulation() {
  const targetsRef = useRef<Record<string, THREE.Object3D>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<{
    obj: THREE.Object3D;
    radius: number;
  } | null>(null);
  const [timeScale, setTimeScale] = useState(10);
  const [resetCamera, setResetCamera] = useState(false);

  const { selectAsteroid, selectedAsteroid, selectedAsteroidId } =
    useAsteroids();

  // Clear the planet dropdown whenever an asteroid is focused
  useEffect(() => {
    if (selectedAsteroidId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedName(null);
    }
  }, [selectedAsteroidId]);

  const goTo = (name: string) => {
    if (BODY_NAMES.includes(name)) {
      // ── Known solar body ──────────────────────────────────────────
      const obj = targetsRef.current[name];
      if (!obj) return;
      setSelectedName(name);
      // selectAsteroid(null); // deselect any asteroid
      const body = [EARTH, MOON, ...PLANETS].find((p) => p.name === name);
      setFlyTarget({ obj, radius: body ? body.radius : SUN.radius });
    } else {
      // ── Asteroid clicked directly in the 3‑D scene ───────────────
      // (only reachable when the Asteroid mesh is already mounted)
      const obj = targetsRef.current[name];
      if (!obj) return;
      const radius = selectedAsteroid
        ? Math.max((selectedAsteroid.diameter_km ?? 1) / 1000, 0.4)
        : 0.4;
      setFlyTarget({ obj, radius });
    }
  };

  // Called by <Asteroid> right after its mesh mounts & registers itself
  const handleAsteroidMount = (obj: THREE.Object3D, radius: number) => {
    setFlyTarget({ obj, radius });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Canvas
        camera={{ position: [0, 22, 46], fov: 50, near: 0.1, far: 2000 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        dpr={[1, 2]}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <Suspense fallback={null}>
          <Scene
            targets={targetsRef}
            selectedName={selectedName}
            flyTarget={flyTarget}
            goTo={goTo}
            controlsRef={controlsRef}
            timeScale={timeScale}
            resetCamera={resetCamera}
            setResetCamera={setResetCamera}
            onAsteroidMount={handleAsteroidMount}
          />
        </Suspense>
      </Canvas>

      {/* Top Control Panel */}
      <div className="w-full absolute top-0 left-0 flex items-center justify-between gap-2 px-4 pt-3">
        <Button
          variant="outline"
          size="sm"
          className="bg-background/30 backdrop-blur-sm z-10"
          asChild
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-1" /> Go Home
          </Link>
        </Button>
        <div className="flex items-center gap-2 z-10">
          <AsteroidsSheet />
          {/* Button which displays the current asteroid name and clear button to deselect it */}
          {selectedAsteroid && (
            <AsteroidControls
              selectedAsteroid={selectedAsteroid}
              setFlyTarget={setFlyTarget}
              setResetCamera={setResetCamera}
            />
          )}
        </div>

        <div className="max-w-[92vw] flex items-center z-10">
          <SelectPlanet
            bodies={BODY_NAMES}
            selectedName={selectedName}
            onSelect={(value) => goTo(value)}
          />
        </div>
      </div>

      {/* Bottom Control Panel */}
      <div className="w-full absolute bottom-0 left-0 flex items-center justify-between gap-2 px-4 pb-2 text-xs font-medium text-muted-foreground">
        <div className="w-full max-w-sm lg:max-w-md flex items-center gap-2 bg-card/30 backdrop-blur-sm px-3 py-1.5 rounded z-10">
          <span>Speed</span>
          <Slider
            defaultValue={[10]}
            max={100}
            step={0.1}
            className="mx-auto"
            onValueChange={(value) => setTimeScale(value[0])}
            value={[timeScale]}
          />
          <span className="text-xs font-medium text-muted-foreground text-nowrap">
            {timeScale.toFixed(1)} days/sec
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="bg-card/30 backdrop-blur-sm z-10"
          onClick={() => {
            setSelectedName(null);
            setFlyTarget(null);
            setResetCamera(true);
          }}
        >
          <Scan className="h-4 w-4" />
        </Button>

        <div className="hidden md:block z-10">
          Drag to rotate · scroll to zoom · click a body to focus
        </div>
      </div>
    </div>
  );
}
