"use client";

import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { SelectPlanet } from "@/components/simulation/SelectPlanetDropdown";
import { EARTH, MOON, PLANETS, SUN } from "@/lib/simulation/data";
import { Planet } from "@/components/simulation/3d-objects/Planet";
import { Slider } from "@/components/ui/slider";
import { SunModel } from "@/components/simulation/3d-objects/Sun";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Scan } from "lucide-react";
import { Earth } from "@/components/simulation/3d-objects/Earth";
// import { Sun } from "@/components/simulation/3d-objects/Sun";

/* -------------------------------------------------------------------- */
/*  Camera rig — flies to / tracks the selected target                    */
/* -------------------------------------------------------------------- */
const DEFAULT_CAMERA_POS = new THREE.Vector3(0, 22, 46);
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0);

function CameraRig({
  target,
  controlsRef,
  resetCamera,
  onResetComplete,
}: {
  target: { obj: THREE.Object3D; radius: number } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: React.RefObject<any>;
  resetCamera: boolean;
  onResetComplete: () => void;
}) {
  const desired = useRef(new THREE.Vector3());
  const worldPos = useRef(new THREE.Vector3());

  useFrame(({ camera }, delta) => {
    if (!controlsRef.current) return;

    // Smooth reset
    if (resetCamera) {
      camera.position.lerp(DEFAULT_CAMERA_POS, Math.min(1, delta * 2));

      controlsRef.current.target.lerp(DEFAULT_TARGET, Math.min(1, delta * 2));

      controlsRef.current.update();

      const cameraDone = camera.position.distanceTo(DEFAULT_CAMERA_POS) < 0.1;

      const targetDone =
        controlsRef.current.target.distanceTo(DEFAULT_TARGET) < 0.1;

      if (cameraDone && targetDone) {
        camera.position.copy(DEFAULT_CAMERA_POS);
        controlsRef.current.target.copy(DEFAULT_TARGET);
        controlsRef.current.update();
        onResetComplete();
      }

      return;
    }

    // Existing planet-follow logic
    if (!target) return;

    target.obj.getWorldPosition(worldPos.current);

    controlsRef.current.target.lerp(worldPos.current, Math.min(1, delta * 3));

    const offsetDist = Math.max(target.radius * 5, 0.3);

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
  flyTarget,
  goTo,
  controlsRef,
  timeScale,
  resetCamera,
  setResetCamera,
}: {
  targets: React.RefObject<Record<string, THREE.Object3D>>;
  selectedName: string | null;
  flyTarget: { obj: THREE.Object3D; radius: number } | null;
  goTo: (name: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: React.RefObject<any>;
  timeScale: number;
  resetCamera: boolean;
  setResetCamera: (reset: boolean) => void;
}) {
  const registerTarget = (name: string, obj: THREE.Object3D) => {
    // eslint-disable-next-line react-hooks/immutability
    if (targets.current) targets.current[name] = obj;
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
        onSelect={goTo}
      />

      <Earth
        body={EARTH}
        registerTarget={registerTarget}
        onSelect={goTo}
        selectedName={selectedName}
        timeScale={timeScale}
      />

      {PLANETS.map((p) => (
        <Planet
          key={p.name}
          body={p}
          registerTarget={registerTarget}
          onSelect={goTo}
          selectedName={selectedName}
          timeScale={timeScale}
        />
      ))}

      <CameraRig
        target={flyTarget}
        controlsRef={controlsRef}
        resetCamera={resetCamera}
        onResetComplete={() => setResetCamera(false)}
      />

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

  const goTo = (name: string) => {
    const obj = targetsRef.current[name];
    if (!obj) return;
    setSelectedName(name);
    const body = [EARTH, MOON, ...PLANETS].find((p) => p.name === name);
    setFlyTarget({ obj, radius: body ? body.radius : SUN.radius });
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
        <SelectPlanet
          bodies={BODY_NAMES}
          selectedName={selectedName}
          onSelect={(value) => goTo(value)}
        />
      </div>

      {/* Bottom Control Panel */}
      <div className="w-full absolute bottom-0 left-0 z-10 flex items-center justify-between gap-2 px-4 pb-2 text-xs font-medium text-muted-foreground">
        {/* Time scale control */}
        <div className="w-full max-w-sm lg:max-w-md flex items-center gap-2 bg-card/30 backdrop-blur-sm px-3 py-1.5 rounded">
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

        {/* Reset Camera Button */}
        <Button
          variant="ghost"
          size="icon"
          className="bg-card/30 backdrop-blur-sm"
          onClick={() => {
            setSelectedName(null);
            setFlyTarget(null);
            setResetCamera(true);
          }}
        >
          <Scan className="h-4 w-4" />
        </Button>

        {/* Hint */}
        <div className="hidden md:block">
          Drag to rotate · scroll to zoom · click a body to focus
        </div>
      </div>
    </div>
  );
}
