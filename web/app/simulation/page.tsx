"use client";

import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { SelectPlanet } from "@/components/simulation/SelectPlanetDropdown";
import { PLANETS, SUN } from "@/lib/simulation/data";
import { Planet } from "@/components/simulation/3d-objects/Planet";
import { Slider } from "@/components/ui/slider";
import { SunModel } from "@/components/models/Sun";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
// import { Sun } from "@/components/simulation/3d-objects/Sun";

/* -------------------------------------------------------------------- */
/*  Camera rig — flies to / tracks the selected target                    */
/* -------------------------------------------------------------------- */

function CameraRig({
  target,
  controlsRef,
}: {
  target: { obj: THREE.Object3D; radius: number } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: React.RefObject<any>;
}) {
  const desired = useRef(new THREE.Vector3());
  const worldPos = useRef(new THREE.Vector3());

  useFrame(({ camera }, delta) => {
    if (!target || !controlsRef.current) return;

    target.obj.getWorldPosition(worldPos.current);

    // Smoothly move the orbit-controls focus point to the target.
    controlsRef.current.target.lerp(worldPos.current, Math.min(1, delta * 3));

    // Keep camera at a comfortable distance proportional to body size.
    const offsetDist = Math.max(target.radius * 6, 4);
    desired.current
      .copy(camera.position)
      .sub(controlsRef.current.target)
      .normalize()
      .multiplyScalar(offsetDist)
      .add(worldPos.current);

    camera.position.lerp(desired.current, Math.min(1, delta * 1.8));
    controlsRef.current.update();
  });

  return null;
}

/* -------------------------------------------------------------------- */
/*  Scene                                                                  */
/* -------------------------------------------------------------------- */

function Scene({
  targets,
  selectedName,
  setSelectedName,
  flyTarget,
  setFlyTarget,
  controlsRef,
  timeScale,
}: {
  targets: React.RefObject<Record<string, THREE.Object3D>>;
  selectedName: string | null;
  setSelectedName: (n: string) => void;
  flyTarget: { obj: THREE.Object3D; radius: number } | null;
  setFlyTarget: (t: { obj: THREE.Object3D; radius: number } | null) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: React.RefObject<any>;
  timeScale: number;
}) {
  const registerTarget = (name: string, obj: THREE.Object3D) => {
    // eslint-disable-next-line react-hooks/immutability
    if (targets.current) targets.current[name] = obj;
  };

  const handleSelect = (name: string, obj: THREE.Object3D) => {
    setSelectedName(name);
    const def = PLANETS.find((p) => p.name === name);
    setFlyTarget({ obj, radius: def ? def.radius : SUN.radius });
  };

  return (
    <>
      {/* <ambientLight intensity={0.1} /> */}
      <Stars
        radius={100}
        depth={80}
        count={5000}
        factor={2.4}
        // fade
        speed={0.5}
      />

      {/* <Sun registerTarget={registerTarget} onSelect={handleSelect} /> */}
      <SunModel
        scale={SUN.radius / 7}
        registerTarget={registerTarget}
        onSelect={handleSelect}
      />

      {PLANETS.map((p) => (
        <Planet
          key={p.name}
          body={p}
          registerTarget={registerTarget}
          onSelect={handleSelect}
          selectedName={selectedName}
          timeScale={timeScale}
        />
      ))}

      <CameraRig target={flyTarget} controlsRef={controlsRef} />

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={180}
        rotateSpeed={0.55}
        zoomSpeed={0.8}
      />
    </>
  );
}

/* -------------------------------------------------------------------- */
/*  Top-level page component                                              */
/* -------------------------------------------------------------------- */

const BODY_NAMES = [SUN.name, ...PLANETS.map((p) => p.name)];

export default function SolarSystemSimulation() {
  const targetsRef = useRef<Record<string, THREE.Object3D>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<{
    obj: THREE.Object3D;
    radius: number;
  } | null>(null);
  const [timeScale, setTimeScale] = useState(15);

  const goTo = (name: string) => {
    const obj = targetsRef.current[name];
    if (!obj) return;
    setSelectedName(name);
    const def = PLANETS.find((p) => p.name === name);
    setFlyTarget({ obj, radius: def ? def.radius : SUN.radius });
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
            setSelectedName={setSelectedName}
            flyTarget={flyTarget}
            setFlyTarget={setFlyTarget}
            controlsRef={controlsRef}
            timeScale={timeScale}
          />
        </Suspense>
      </Canvas>

      {/* Go Home Button */}
      <Button
        variant="outline"
        size="sm"
        className="absolute top-4 left-4 z-10 bg-background/30 backdrop-blur-sm"
        asChild
      >
        <Link href="/">
          <ArrowLeft className="h-4 w-4 mr-1" /> Go Home
        </Link>
      </Button>
      {/* Navigation panel */}
      <div className="max-w-[92vw] absolute top-4 right-4 z-10">
        <SelectPlanet bodies={BODY_NAMES} onSelect={(value) => goTo(value)} />
      </div>

      {/* Time scale control */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-full border border-border/60 bg-card/30 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
        <span className="text-xs font-medium text-muted-foreground">Speed</span>
        <Slider
          defaultValue={[15]}
          max={100}
          step={0.1}
          className="mx-auto w-xs"
          onValueChange={(value) => setTimeScale(value[0])}
          value={[timeScale]}
        />
        <span className="text-xs font-medium text-muted-foreground">
          {timeScale.toFixed(1)}x
        </span>
      </div>

      {/* Hint */}
      <div className="absolute z-10 bottom-4 right-4 opacity-90 text-xs text-muted-foreground">
        Drag to rotate · scroll to zoom · click a body to focus
      </div>
    </div>
  );
}
