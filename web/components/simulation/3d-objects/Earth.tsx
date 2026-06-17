/* -------------------------------------------------------------------- */
/*  Earth                                                                 */
/* -------------------------------------------------------------------- */

import * as THREE from "three";

import { EarthDef, MOON } from "@/lib/simulation/data";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitRing } from "./OrbitRing";
import { useLoader } from "@react-three/fiber";
import { Moon } from "./Moon";
import BodyLabel from "../BodyLabel";

export const Earth = ({
  body,
  registerTarget,
  onSelect,
  selectedName,
  timeScale,
}: {
  body: EarthDef;
  registerTarget: (name: string, obj: THREE.Object3D) => void;
  onSelect: (name: string) => void;
  selectedName: string | null;
  timeScale: number;
}) => {
  // eslint-disable-next-line react-hooks/purity
  const angleRef = useRef(Math.random() * Math.PI * 2);
  const earthOrbitRef = useRef<THREE.Group>(null!);
  const earthSpinRef = useRef<THREE.Mesh>(null!);
  const dayMap = useLoader(
    THREE.TextureLoader,
    body.texture?.day ?? "/textures/default.jpg",
  );
  const nightMap = body.texture.night
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useLoader(THREE.TextureLoader, body.texture.night)
    : null;

  useFrame((_, delta) => {
    angleRef.current += body.speed * delta * timeScale * 0.0219;
    // Earth orbit around Sun
    if (earthOrbitRef.current) {
      earthOrbitRef.current.rotation.y = angleRef.current;
    }

    // Earth self-rotation
    if (earthSpinRef.current) {
      earthSpinRef.current.rotation.y += delta * 0.6;
    }
  });

  // eslint-disable-next-line react-hooks/immutability
  useEffect(() => {
    // Register Earth as a target for camera focus
    if (earthSpinRef.current) {
      registerTarget(body.name, earthSpinRef.current);
    }
    // eslint-disable-next-line react-hooks/immutability
    dayMap.colorSpace = THREE.SRGBColorSpace;

    if (nightMap) {
      // eslint-disable-next-line react-hooks/immutability
      nightMap.colorSpace = THREE.SRGBColorSpace;
    }
  }, [dayMap, nightMap]);

  return (
    <group ref={earthOrbitRef}>
      <OrbitRing radius={body.distance} />

      <group position={[body.distance, 0, 0]}>
        <mesh
          ref={earthSpinRef}
          onClick={(e) => {
            e.stopPropagation();
            if (earthSpinRef.current) {
              onSelect(body.name);
            }
          }}
        >
          <sphereGeometry args={[body.radius, 32, 32]} />
          <meshStandardMaterial
            map={dayMap}
            emissiveMap={nightMap}
            emissive="blue"
            emissiveIntensity={selectedName === body.name ? 1 : 0.5}
            roughness={0.9}
          />
        </mesh>

        <BodyLabel name={body.name} radius={body.radius} />

        {/* 👇 MOON GOES INSIDE EARTH */}
        <Moon
          body={MOON}
          parentRadius={body.radius}
          timeScale={timeScale}
          registerTarget={registerTarget}
          onSelect={onSelect}
          selectedName={selectedName}
        />
      </group>
    </group>
  );
};
