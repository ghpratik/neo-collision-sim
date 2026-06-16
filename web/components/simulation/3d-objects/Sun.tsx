/* -------------------------------------------------------------------- */
/*  Sun                                                                    */
/* -------------------------------------------------------------------- */

import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { SUN } from "@/lib/simulation/data";

export function Sun({
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
