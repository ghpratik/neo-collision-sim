"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

export interface AsteroidBody {
  name: string;
  type: string;
  pha: boolean;
  diameter_km: number | null;
  color: string;
  orbital_elements: {
    a_au: number;
    e: number;
    i_deg: number;
    Omega_deg: number;
    omega_deg: number;
    epoch_jd: number;
  };
  positions: {
    x: number[];
    y: number[];
    z: number[];
  };
}

interface AsteroidsData {
  time_jd: number[];
  bodies: Record<string, AsteroidBody>;
}

interface AsteroidContextValue {
  loading: boolean;
  timeJd: number[];
  asteroids: { id: string; data: AsteroidBody }[];
  selectedAsteroidId: string | null;
  selectedAsteroid: AsteroidBody | null;
  selectAsteroid: (id: string | null) => void;
}

const AsteroidContext = createContext<AsteroidContextValue | null>(null);

export const AsteroidProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<AsteroidsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAsteroidId, setSelectedAsteroidId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let mounted = true;
    fetch("/asteroids.json")
      .then((res) => res.json())
      .then((json: AsteroidsData) => {
        if (mounted) setData(json);
      })
      .catch((err) => console.error("Failed to load asteroids", err))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const selectAsteroid = useCallback((id: string | null) => {
    setSelectedAsteroidId(id);
  }, []);

  const asteroids = data
    ? Object.entries(data.bodies).map(([id, body]) => ({ id, data: body }))
    : [];

  const selectedAsteroid =
    data && selectedAsteroidId
      ? (data.bodies[selectedAsteroidId] ?? null)
      : null;

  return (
    <AsteroidContext.Provider
      value={{
        loading,
        timeJd: data?.time_jd ?? [],
        asteroids,
        selectedAsteroidId,
        selectedAsteroid,
        selectAsteroid,
      }}
    >
      {children}
    </AsteroidContext.Provider>
  );
};

export const useAsteroids = () => {
  const ctx = useContext(AsteroidContext);
  if (!ctx)
    throw new Error("useAsteroids must be used within an AsteroidProvider");
  return ctx;
};
