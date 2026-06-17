import { useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { OrbitRing } from "./OrbitRing";
import { EarthDef } from "@/lib/simulation/data";
import * as THREE from "three";
import BodyLabel from "../BodyLabel";

type MoonProps = {
  body: EarthDef;
  parentRadius: number;
  registerTarget: (name: string, obj: THREE.Object3D) => void;
  onSelect: (name: string) => void;
  selectedName: string | null;
  timeScale: number;
};

export const Moon = ({
  body,
  timeScale,
  registerTarget,
  onSelect,
  selectedName,
}: MoonProps) => {
  const orbitRef = useRef<THREE.Group>(null!);
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    dayMap.colorSpace = THREE.SRGBColorSpace;
    // eslint-disable-next-line react-hooks/immutability
    if (nightMap) nightMap.colorSpace = THREE.SRGBColorSpace;
  }, [dayMap, nightMap]);

  useFrame((_, delta) => {
    // Register Moon as a target for camera focus
    if (meshRef.current) {
      registerTarget(body.name, meshRef.current);
    }
    // Moon orbit around Earth (local rotation)
    angleRef.current += body.speed * delta * timeScale * 0.05;

    if (orbitRef.current) {
      orbitRef.current.rotation.y = angleRef.current;
    }

    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group ref={orbitRef}>
      <OrbitRing radius={body.distance} />

      <group position={[body.distance, 0, 0]}>
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
            emissiveMap={nightMap}
            emissive="white"
            emissiveIntensity={selectedName === body.name ? 1 : 0.5}
          />
        </mesh>

        <BodyLabel name={body.name} radius={body.radius} />
      </group>
    </group>
  );
};
