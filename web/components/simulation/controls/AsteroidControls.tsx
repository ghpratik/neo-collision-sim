import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import React from "react";
import * as THREE from "three";

interface AsteroidControlsProps {
  name: string;
  setFlyTarget: (
    target: { obj: THREE.Object3D; radius: number } | null,
  ) => void;
  selectAsteroid: (id: string | null) => void;
  setResetCamera: (reset: boolean) => void;
}

const AsteroidControls: React.FC<AsteroidControlsProps> = ({
  name,
  setFlyTarget,
  selectAsteroid,
  setResetCamera,
}) => {
  return (
    <div>
      {" "}
      <Button
        variant="ghost"
        size="icon"
        className="bg-card/30 backdrop-blur-sm z-10"
        onClick={() => {
          setFlyTarget(null);
          selectAsteroid(null);
          setResetCamera(true);
        }}
      >
        {name}
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default AsteroidControls;
