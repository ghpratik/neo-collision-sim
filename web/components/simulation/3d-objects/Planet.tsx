/* -------------------------------------------------------------------- */
/*  Planet                                                                 */
/* -------------------------------------------------------------------- */

import * as THREE from "three";

import { Html } from "@react-three/drei";
import { BodyDef } from "@/lib/simulation/data";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitRing } from "./OrbitRing";
import { useLoader } from "@react-three/fiber";

export const Planet = ({
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
}) => {
  const pivotRef = useRef<THREE.Group>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);
  // eslint-disable-next-line react-hooks/purity
  const angleRef = useRef(Math.random() * Math.PI * 2);
  const dayMap = useLoader(
    THREE.TextureLoader,
    body.texture?.day ?? "/textures/default.jpg",
  );
  const nightMap = body.texture?.night
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useLoader(THREE.TextureLoader, body.texture.night)
    : null;
  const ringMap = body.texture?.ring
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useLoader(THREE.TextureLoader, body.texture.ring)
    : null;

  useFrame((_, delta) => {
    angleRef.current += body.speed * delta * timeScale * 0.0219;
    if (pivotRef.current) {
      pivotRef.current.rotation.y = angleRef.current;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.6;
    }
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    dayMap.colorSpace = THREE.SRGBColorSpace;

    if (nightMap) {
      // eslint-disable-next-line react-hooks/immutability
      nightMap.colorSpace = THREE.SRGBColorSpace;
    }

    if (ringMap) {
      // eslint-disable-next-line react-hooks/immutability
      ringMap.colorSpace = THREE.SRGBColorSpace;
    }
  }, [dayMap, nightMap, ringMap]);

  return (
    <group>
      <OrbitRing radius={body.distance} />
      <group ref={pivotRef}>
        {/* <pointLight color="#fff8d0" intensity={100} distance={0} decay={2} /> */}
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
            {nightMap ? (
              <meshStandardMaterial
                map={dayMap}
                emissiveMap={nightMap}
                emissive="white"
                emissiveIntensity={1}
                // emissiveIntensity={selectedName === body.name ? 1 : 0.5}
                roughness={0.9}
                metalness={0}
              />
            ) : (
              <meshStandardMaterial
                map={dayMap}
                emissiveIntensity={selectedName === body.name ? 1 : 0.5}
                roughness={0.9}
                metalness={0}
              />
            )}
          </mesh>

          {body.ring && (
            <mesh rotation={[Math.PI / 2.1, 0, 0]}>
              <ringGeometry args={[body.ring.inner, body.ring.outer, 64]} />
              <meshBasicMaterial
                map={ringMap}
                transparent
                opacity={0.9}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          )}

          <Html distanceFactor={28} position={[0, body.radius + 0.9, 0]} center>
            <div className="text-sm text-muted-foreground pointer-events-none select-none whitespace-nowrap opacity-80 text-shadow">
              {body.name}
            </div>
          </Html>
        </group>
      </group>
    </group>
  );
};
