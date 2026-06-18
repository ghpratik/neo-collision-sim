import * as THREE from "three";
import React from "react";
import { useLoader, useFrame } from "@react-three/fiber";
import { SUN } from "@/lib/simulation/data";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Sun({ registerTarget, onSelect, ...props }: any) {
  const group = React.useRef<THREE.Group>(null!);
  const meshRef = React.useRef<THREE.Mesh>(null!);

  const sunTexture = useLoader(THREE.TextureLoader, "/textures/sun.jpg");

  React.useEffect(() => {
    if (!sunTexture) return;

    // eslint-disable-next-line react-hooks/immutability
    sunTexture.colorSpace = THREE.SRGBColorSpace;
    sunTexture.anisotropy = 16;
  }, [sunTexture]);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group
      ref={(obj) => {
        if (obj) {
          group.current = obj;
          registerTarget(SUN.name, obj);
        }
      }}
      {...props}
    >
      {/* IMPORTANT: Sun should be emissive + not depend on light */}
      <pointLight intensity={3000} color="#fff4d6" />

      <mesh ref={meshRef} onClick={() => onSelect(SUN.name)}>
        <sphereGeometry args={[SUN.radius, 64, 64]} />

        <meshBasicMaterial map={sunTexture} toneMapped={false} />
      </mesh>
    </group>
  );
}
