import * as THREE from "three";
import React from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { GLTF } from "three-stdlib";
import { SUN } from "@/lib/simulation/data";

type ActionName = "Take 001";

interface GLTFAction extends THREE.AnimationClip {
  name: ActionName;
}

type GLTFResult = GLTF & {
  nodes: {
    UnstableStarCore_1_0: THREE.Mesh;
    UnstableStarref_2_0: THREE.Mesh;
  };
  materials: {
    material: THREE.MeshStandardMaterial;
    material_1: THREE.MeshPhysicalMaterial;
  };
  animations: GLTFAction[];
};

type SunModelProps = React.JSX.IntrinsicElements["group"] & {
  registerTarget: (name: string, obj: THREE.Object3D) => void;
  onSelect: (name: string, obj: THREE.Object3D) => void;
};

export function SunModel({
  registerTarget,
  onSelect,
  ...props
}: SunModelProps) {
  const group = React.useRef<THREE.Group>(null);

  const corona1 = React.useRef<THREE.Mesh>(null);
  const corona2 = React.useRef<THREE.Mesh>(null);

  const { nodes, materials, animations } = useGLTF(
    "/models/sun.glb",
  ) as unknown as GLTFResult;

  useAnimations(animations, group);

  /* -------------------------- corona animation ---------------------------- */
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
      dispose={null}
      onClick={(e) => {
        e.stopPropagation();
        if (group.current) onSelect(SUN.name, group.current);
      }}
      scale={SUN.radius / 7}
    >
      {/* --------------------------- LIGHT SOURCE --------------------------- */}
      <pointLight color="#fff4d6" intensity={8000} distance={0} decay={2} />

      {/* --------------------------- SUN MODEL --------------------------- */}
      <group name="Sketchfab_Scene">
        <group name="Sketchfab_model" rotation={[-Math.PI / 2, 0, 0]}>
          <group
            name="3a2aaa22fb3d4b329318a980ad1bf6d1fbx"
            rotation={[Math.PI / 2, 0, 0]}
          >
            <group name="Object_2">
              <group name="RootNode">
                <group name="UnstableStarCore" rotation={[-Math.PI / 2, 0, 0]}>
                  <mesh
                    name="UnstableStarCore_1_0"
                    geometry={nodes.UnstableStarCore_1_0.geometry}
                    material={materials.material}
                  />
                </group>

                <group
                  name="UnstableStarref"
                  rotation={[-Math.PI / 2, 0, 0]}
                  scale={1.01}
                >
                  <mesh
                    name="UnstableStarref_2_0"
                    geometry={nodes.UnstableStarref_2_0.geometry}
                    material={materials.material_1}
                  />
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload("/models/sun.glb");
