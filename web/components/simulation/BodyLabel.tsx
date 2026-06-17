import { Html } from "@react-three/drei";

interface BodyNamesProps {
  name: string;
  radius: number;
}
const BodyLabel = ({ name, radius }: BodyNamesProps) => {
  return (
    <Html distanceFactor={28} position={[0, radius + 0.9, 0]} center>
      <div className="text-sm text-muted-foreground pointer-events-none select-none whitespace-nowrap opacity-80 text-shadow">
        {name}
      </div>
    </Html>
  );
};

export default BodyLabel;
