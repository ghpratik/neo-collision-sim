"use client";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { useEffect } from "react";
import { Sun } from "./3d-objects/Sun";
import { Earth } from "./3d-objects/Earth";
import { Asteroid } from "./3d-objects/Asteroid";
import { EARTH, PLANETS, SUN } from "@/lib/simulation/data";
import { Planet } from "./3d-objects/Planet";
import CameraRig from "./CameraRig";
import { useAsteroids } from "@/contexts/AsteroidContext";

interface SceneProps {
  targets: React.RefObject<Record<string, THREE.Object3D>>;
  selectedName: string | null;
  flyTarget: { obj: THREE.Object3D; radius: number } | null;
  goTo: (name: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: React.RefObject<any>;
  timeScale: number;
  resetCamera: boolean;
  setResetCamera: (reset: boolean) => void;
}

const Scene: React.FC<SceneProps> = ({
  targets,
  selectedName,
  flyTarget,
  goTo,
  controlsRef,
  timeScale,
  resetCamera,
  setResetCamera,
}) => {
  const { selectedAsteroidId, selectedAsteroid } = useAsteroids();

  const registerTarget = (name: string, obj: THREE.Object3D) => {
    // eslint-disable-next-line react-hooks/immutability
    if (targets.current) targets.current[name] = obj;
  };

  // Fly the camera to the asteroid as soon as it's selected & registered
  useEffect(() => {
    if (selectedAsteroidId) {
      goTo(selectedAsteroidId);
    }
  }, [selectedAsteroidId, goTo]);

  return (
    <>
      <Stars radius={100} depth={80} count={5000} factor={2.4} speed={0.5} />
      <Sun
        scale={SUN.radius / 7}
        registerTarget={registerTarget}
        onSelect={goTo}
      />
      <Earth
        body={EARTH}
        registerTarget={registerTarget}
        onSelect={goTo}
        selectedName={selectedName}
        timeScale={timeScale}
      />
      {PLANETS.map((p) => (
        <Planet
          key={p.name}
          body={p}
          registerTarget={registerTarget}
          onSelect={goTo}
          selectedName={selectedName}
          timeScale={timeScale}
        />
      ))}

      {selectedAsteroidId && selectedAsteroid && (
        <Asteroid
          id={selectedAsteroidId}
          body={selectedAsteroid}
          timeScale={timeScale}
          selectedName={selectedName}
          registerTarget={registerTarget}
          onSelect={goTo}
        />
      )}

      <CameraRig
        target={flyTarget}
        controlsRef={controlsRef}
        resetCamera={resetCamera}
        onResetComplete={() => setResetCamera(false)}
      />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={180}
        rotateSpeed={0.55}
        zoomSpeed={0.8}
      />
    </>
  );
};

export default Scene;
