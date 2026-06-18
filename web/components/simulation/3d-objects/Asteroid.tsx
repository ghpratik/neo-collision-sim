"use client";
import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import type { AsteroidBody } from "@/contexts/AsteroidContext";

// ⚠️ Match this to whatever AU->scene-units factor your Earth/Planet
// components use, so the asteroid lines up with the rest of the solar system.
const AU_SCALE = 10;

// How many of the 730 sampled frames to advance per second at timeScale = 1.
// Higher = faster playback through the precomputed trajectory.
const FRAMES_PER_SECOND = 1;

interface AsteroidProps {
  id: string;
  body: AsteroidBody;
  timeScale: number;
  selectedName: string | null;
  registerTarget: (name: string, obj: THREE.Object3D) => void;
  onSelect: (name: string) => void;
}

// Converts heliocentric-ecliptic (x right, y in-plane, z = north/up out of
// ecliptic) into three.js's y-up convention. Flip signs here if your
// Earth/Planet components use a different handedness.
function eclipticToThree(
  x: number,
  y: number,
  z: number,
): [number, number, number] {
  return [x * AU_SCALE, z * AU_SCALE, -y * AU_SCALE];
}

export const Asteroid: React.FC<AsteroidProps> = ({
  id,
  body,
  timeScale,
  selectedName,
  registerTarget,
  onSelect,
}) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const elapsed = useRef(0);

  const points = useMemo(() => {
    const { x, y, z } = body.positions;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < x.length; i++) {
      const [px, py, pz] = eclipticToThree(x[i], y[i], z[i]);
      pts.push(new THREE.Vector3(px, py, pz));
    }
    return pts;
  }, [body.positions]);

  const totalFrames = points.length;

  useEffect(() => {
    if (meshRef.current) registerTarget(id, meshRef.current);
  }, [id, registerTarget]);

  useFrame((_, delta) => {
    if (!meshRef.current || totalFrames < 2) return;

    elapsed.current += delta * timeScale * FRAMES_PER_SECOND;
    const t = ((elapsed.current % totalFrames) + totalFrames) % totalFrames;
    const i0 = Math.floor(t);
    const i1 = (i0 + 1) % totalFrames;
    const frac = t - i0;

    const p0 = points[i0];
    const p1 = points[i1];

    meshRef.current.position.set(
      THREE.MathUtils.lerp(p0.x, p1.x, frac),
      THREE.MathUtils.lerp(p0.y, p1.y, frac),
      THREE.MathUtils.lerp(p0.z, p1.z, frac),
    );
  });

  const isSelected = selectedName === id;
  const radius = Math.max((body.diameter_km ?? 1) / 1000, 0.04);

  return (
    <group>
      {/* Trajectory path computed from the precomputed positions */}
      <Line
        points={points}
        color={body.color}
        lineWidth={1}
        transparent
        opacity={0.45}
      />

      {/* The moving asteroid marker */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(id);
        }}
      >
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial
          color={body.color}
          emissive={isSelected ? body.color : "#000000"}
          emissiveIntensity={isSelected ? 1.2 : 0}
        />
      </mesh>
    </group>
  );
};
