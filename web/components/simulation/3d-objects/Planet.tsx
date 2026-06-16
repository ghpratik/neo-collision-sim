/* -------------------------------------------------------------------- */
/*  Planet                                                                 */
/* -------------------------------------------------------------------- */

import * as THREE from "three";

import { Html } from "@react-three/drei";
import { BodyDef } from "@/lib/simulation/data";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitRing } from "./OrbitRing";

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
};
