/* -------------------------------------------------------------------- */
/*  Camera rig — flies to / tracks the selected target                    */

import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

/* -------------------------------------------------------------------- */
const DEFAULT_CAMERA_POS = new THREE.Vector3(0, 22, 46);
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0);

interface CameraRigProps {
  target: { obj: THREE.Object3D; radius: number } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: React.RefObject<any>;
  resetCamera: boolean;
  onResetComplete: () => void;
}

export const CameraRig: React.FC<CameraRigProps> = ({
  target,
  controlsRef,
  resetCamera,
  onResetComplete,
}) => {
  const desired = useRef(new THREE.Vector3());
  const worldPos = useRef(new THREE.Vector3());

  useFrame(({ camera }, delta) => {
    if (!controlsRef.current) return;

    // Smooth reset
    if (resetCamera) {
      camera.position.lerp(DEFAULT_CAMERA_POS, Math.min(1, delta * 2));

      controlsRef.current.target.lerp(DEFAULT_TARGET, Math.min(1, delta * 2));

      controlsRef.current.update();

      const cameraDone = camera.position.distanceTo(DEFAULT_CAMERA_POS) < 0.1;

      const targetDone =
        controlsRef.current.target.distanceTo(DEFAULT_TARGET) < 0.1;

      if (cameraDone && targetDone) {
        camera.position.copy(DEFAULT_CAMERA_POS);
        controlsRef.current.target.copy(DEFAULT_TARGET);
        controlsRef.current.update();
        onResetComplete();
      }

      return;
    }

    // Existing planet-follow logic
    if (!target) return;

    target.obj.getWorldPosition(worldPos.current);

    controlsRef.current.target.lerp(worldPos.current, Math.min(1, delta * 3));

    const offsetDist = Math.max(target.radius * 5, 0.3);

    desired.current
      .copy(camera.position)
      .sub(controlsRef.current.target)
      .normalize()
      .multiplyScalar(offsetDist)
      .add(worldPos.current);

    camera.position.lerp(desired.current, Math.min(1, delta * 1.8));

    controlsRef.current.update();
  });

  return null;
};

export default CameraRig;
