import { AsteroidProvider } from "@/contexts/AsteroidContext";

const SimulationLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <AsteroidProvider>{children}</AsteroidProvider>;
};

export default SimulationLayout;
