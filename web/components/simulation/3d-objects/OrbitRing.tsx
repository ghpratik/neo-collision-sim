/* -------------------------------------------------------------------- */
/*  Orbit ring (static line so the path is always visible)                */
/* -------------------------------------------------------------------- */

import { Line } from "@react-three/drei";
import { useMemo } from "react";

export function OrbitRing({ radius }: { radius: number }) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push([Math.cos(theta) * radius, 0, Math.sin(theta) * radius]);
    }
    return pts;
  }, [radius]);

  return (
    <Line
      points={points}
      color="#3a3f4b"
      transparent
      opacity={0.45}
      lineWidth={1}
    />
  );
}
