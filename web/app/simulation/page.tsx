"use client";

import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { SelectPlanet } from "@/components/simulation/SelectPlanetDropdown";
import { BodyDef, PLANETS, SUN } from "@/lib/simulation/data";
import { OrbitRing } from "@/components/simulation/3d-objects/OrbitRing";
import { Planet } from "@/components/simulation/3d-objects/Planet";
import { Slider } from "@/components/ui/slider";

/* -------------------------------------------------------------------- */
/*  Sun                                                                    */
/* -------------------------------------------------------------------- */

function Sun({
  registerTarget,
  onSelect,
}: {
  registerTarget: (name: string, obj: THREE.Object3D) => void;
  onSelect: (name: string, obj: THREE.Object3D) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.05;
  });

  return (
    <mesh
      ref={(obj) => {
        if (obj) {
          meshRef.current = obj;
          registerTarget(SUN.name, obj);
        }
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (meshRef.current) onSelect(SUN.name, meshRef.current);
      }}
    >
      <sphereGeometry args={[SUN.radius, 48, 48]} />
      <meshBasicMaterial color={SUN.color} />
      <pointLight color="#fff4d6" intensity={3.5} distance={200} decay={1.5} />
    </mesh>
  );
}

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
      <ambientLight intensity={0.06} />
      <Stars
        radius={300}
        depth={80}
        count={6000}
        factor={2.4}
        fade
        speed={0.4}
      />

      <Sun registerTarget={registerTarget} onSelect={handleSelect} />

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
  const [timeScale, setTimeScale] = useState(1);

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
        gl={{ antialias: true }}
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

      {/* Navigation panel */}
      <div className="hidden md:flex flex-wrap gap-2 max-w-[92vw] absolute top-4 left-4 z-10">
        <SelectPlanet bodies={BODY_NAMES} onSelect={(value) => goTo(value)} />
      </div>

      {/* Time scale control */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-full border border-border/60 bg-card/30 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
        <span className="text-xs font-medium text-muted-foreground">Speed</span>
        {/* <input
          type="range"
          min={0}
          max={5}
          step={0.1}
          value={timeScale}
          onChange={(e) => setTimeScale(parseFloat(e.target.value))}
          style={{ width: "120px" }}
        /> */}
        <Slider
          defaultValue={[3]}
          max={30}
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
      <div
        style={{
          position: "absolute",
          bottom: 18,
          right: 16,
          fontSize: "11px",
          color: "#6b7280",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        Drag to rotate · scroll to zoom · click a body to focus
      </div>
    </div>
  );
}
