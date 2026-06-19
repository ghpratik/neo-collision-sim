"use client";
import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import type { AsteroidBody } from "@/contexts/AsteroidContext";
import BodyLabel from "../controls/BodyLabel";

const AU_SCALE = 14.96;
const FRAMES_PER_SECOND = 4;

interface AsteroidProps {
  id: string;
  body: AsteroidBody;
  timeScale: number;
  selectedName: string | null;
  registerTarget: (name: string, obj: THREE.Object3D) => void;
  onSelect: (name: string) => void;
  onMount: (obj: THREE.Object3D, radius: number) => void; // ← new
}

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
  onMount,
}) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const elapsed = useRef(0);

  const points = useMemo(() => {
    const { x, y, z } = body.positions;
    return x.map(
      (_, i) => new THREE.Vector3(...eclipticToThree(x[i], y[i], z[i])),
    );
  }, [body.positions]);

  const totalFrames = points.length;

  // Initial position so the mesh doesn't sit at origin before the first frame
  const initialPos = points[0] ?? new THREE.Vector3();

  useEffect(() => {
    if (!meshRef.current) return;
    registerTarget(id, meshRef.current);
    const radius = Math.max((body.diameter_km ?? 1) / 1000, 0.4);
    onMount(meshRef.current, radius); // ← fire after mesh is in targets
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // intentionally only on mount

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
      <Line
        points={points}
        color={body.color}
        lineWidth={1}
        transparent
        opacity={0.45}
      />
      <mesh
        ref={meshRef}
        position={[initialPos.x, initialPos.y, initialPos.z]}
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
        <BodyLabel name={body.name} radius={radius} />
      </mesh>
    </group>
  );
};
