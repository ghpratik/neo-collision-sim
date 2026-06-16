"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { SelectPlanet } from "@/components/simulation/SelectPlanet";

/* -------------------------------------------------------------------- */
/*  Data                                                                  */
/* -------------------------------------------------------------------- */

interface BodyDef {
  name: string;
  color: string;
  radius: number; // visual radius (log-scaled, not to real scale)
  distance: number; // visual orbit radius from the sun
  speed: number; // radians / second (relative, exaggerated for visibility)
  tilt?: number; // axial tilt, purely decorative
  ring?: { inner: number; outer: number; color: string }; // Saturn
}

const SUN = { name: "Sun", color: "#FDB813", radius: 3.2 };

const PLANETS: BodyDef[] = [
  { name: "Mercury", color: "#9C9C94", radius: 0.32, distance: 7, speed: 0.48 },
  { name: "Venus", color: "#E8C27A", radius: 0.5, distance: 10, speed: 0.35 },
  { name: "Earth", color: "#3D7FD9", radius: 0.55, distance: 14, speed: 0.29 },
  { name: "Mars", color: "#C1502E", radius: 0.42, distance: 18, speed: 0.24 },
  { name: "Jupiter", color: "#D8A268", radius: 1.7, distance: 26, speed: 0.13 },
  {
    name: "Saturn",
    color: "#E3C589",
    radius: 1.45,
    distance: 34,
    speed: 0.097,
    ring: { inner: 1.9, outer: 3.0, color: "#C9B58A" },
  },
  { name: "Uranus", color: "#9FD0DD", radius: 1.0, distance: 41, speed: 0.068 },
  {
    name: "Neptune",
    color: "#4D72D9",
    radius: 0.97,
    distance: 48,
    speed: 0.054,
  },
];

/* -------------------------------------------------------------------- */
/*  Orbit ring (static line so the path is always visible)                */
/* -------------------------------------------------------------------- */

function OrbitRing({ radius }: { radius: number }) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push([Math.cos(theta) * radius, 0, Math.sin(theta) * radius]);
    }
    return pts;
  }, [radius]);

  return (
    <Line
      points={points}
      color="#3a3f4b"
      transparent
      opacity={0.45}
      lineWidth={1}
    />
  );
}

/* -------------------------------------------------------------------- */
/*  Planet                                                                 */
/* -------------------------------------------------------------------- */

function Planet({
  body,
  registerTarget,
  onSelect,
  selectedName,
  timeScale,
}: {
  body: BodyDef;
  registerTarget: (name: string, obj: THREE.Object3D) => void;
  onSelect: (name: string, obj: THREE.Object3D) => void;
  selectedName: string | null;
  timeScale: number;
}) {
  const pivotRef = useRef<THREE.Group>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  // eslint-disable-next-line react-hooks/purity
  const angleRef = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    angleRef.current += body.speed * delta * timeScale;
    if (pivotRef.current) {
      pivotRef.current.rotation.y = angleRef.current;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.6;
    }
  });

  return (
    <group>
      <OrbitRing radius={body.distance} />
      <group ref={pivotRef}>
        <group
          position={[body.distance, 0, 0]}
          ref={(obj) => {
            if (obj) registerTarget(body.name, obj);
          }}
        >
          <mesh
            ref={meshRef}
            onClick={(e) => {
              e.stopPropagation();
              if (meshRef.current) onSelect(body.name, meshRef.current);
            }}
          >
            <sphereGeometry args={[body.radius, 32, 32]} />
            <meshStandardMaterial
              color={body.color}
              emissive={body.color}
              emissiveIntensity={selectedName === body.name ? 0.6 : 0.08}
              roughness={0.85}
            />
          </mesh>

          {body.ring && (
            <mesh rotation={[Math.PI / 2.1, 0, 0]}>
              <ringGeometry args={[body.ring.inner, body.ring.outer, 64]} />
              <meshBasicMaterial
                color={body.ring.color}
                transparent
                opacity={0.55}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}

          <Html distanceFactor={28} position={[0, body.radius + 0.9, 0]} center>
            <div
              style={{
                color: "#cfd6e6",
                fontSize: "11px",
                fontFamily: "system-ui, sans-serif",
                whiteSpace: "nowrap",
                opacity: 0.75,
                textShadow: "0 0 4px rgba(0,0,0,0.9)",
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              {body.name}
            </div>
          </Html>
        </group>
      </group>
    </group>
  );
}

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
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#05070d",
      }}
    >
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
        {/* {BODY_NAMES.map((name) => (
          <Button
            key={name}
            onClick={() => goTo(name)}
            className={
              selectedName === name
                ? "bg-primary/20 border-primary/50"
                : "bg-card/40 border-border/60"
            }
          >
            {name}
          </Button>
        ))} */}
      </div>

      {/* Time scale control */}
      <div
        style={{
          position: "absolute",
          bottom: 18,
          left: 16,
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 14px",
          borderRadius: "999px",
          background: "rgba(20,22,30,0.6)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(6px)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <span style={{ fontSize: "11px", color: "#9aa3b5" }}>Speed</span>
        <input
          type="range"
          min={0}
          max={5}
          step={0.1}
          value={timeScale}
          onChange={(e) => setTimeScale(parseFloat(e.target.value))}
          style={{ width: "120px" }}
        />
        <span style={{ fontSize: "11px", color: "#cfd6e6", width: "28px" }}>
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
