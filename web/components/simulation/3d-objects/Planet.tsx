/* -------------------------------------------------------------------- */
/*  Planet                                                                 */
/* -------------------------------------------------------------------- */

import * as THREE from "three";

import { BodyDef } from "@/lib/simulation/data";
import React, { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitRing } from "./OrbitRing";
import { useLoader } from "@react-three/fiber";
import BodyLabel from "../controls/BodyLabel";

export const Planet = ({
  body,
  registerTarget,
  onSelect,
  selectedName,
  timeScale,
}: {
  body: BodyDef;
  registerTarget: (name: string, obj: THREE.Object3D) => void;
  onSelect: (name: string) => void;
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

  const ringGeometry = React.useMemo(() => {
    if (!body.ring) return null;

    const geometry = new THREE.RingGeometry(
      body.ring.inner,
      body.ring.outer,
      128,
    );

    const pos = geometry.attributes.position;
    const uv = geometry.attributes.uv;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);

      const r = Math.sqrt(x * x + y * y);

      const u = (r - body.ring.inner) / (body.ring.outer - body.ring.inner);

      uv.setXY(i, u, 0.5);
    }

    uv.needsUpdate = true;

    return geometry;
  }, [body.ring]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    dayMap.colorSpace = THREE.SRGBColorSpace;

    if (ringMap) {
      // eslint-disable-next-line react-hooks/immutability
      ringMap.colorSpace = THREE.SRGBColorSpace;

      ringMap.wrapS = THREE.ClampToEdgeWrapping;
      ringMap.wrapT = THREE.ClampToEdgeWrapping;

      ringMap.anisotropy = 16;
      ringMap.needsUpdate = true;
    }
  }, [dayMap, ringMap]);

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
              onSelect(body.name);
            }}
          >
            <sphereGeometry args={[body.radius, 32, 32]} />

            <meshStandardMaterial
              map={dayMap}
              emissive={body.color}
              emissiveIntensity={selectedName === body.name ? 1 : 0.5}
              roughness={0.9}
              metalness={0}
            />
          </mesh>

          {body.ring && ringGeometry && (
            <mesh geometry={ringGeometry} rotation={[Math.PI / 2.1, 0, 0]}>
              <meshBasicMaterial
                map={ringMap}
                transparent
                alphaTest={0.05}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          )}

          <BodyLabel name={body.name} radius={body.radius} />
        </group>
      </group>
    </group>
  );
};
