"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";

export interface OrbitalElements {
  a_au: number;
  e: number;
  i_deg: number;
  Omega_deg: number;
  omega_deg: number;
  epoch_jd: number;
}

export interface AsteroidPositions {
  x: number[];
  y: number[];
  z: number[];
}

export interface AsteroidSummary {
  id: string;
  name: string;
  type: string;
  pha: boolean;
  diameter_km: number | null;
  color: string;
  risk_score: number;
  predicted_hazard_probability: number | null;
  close_approach_date: string | null;
}

export interface AsteroidDetail extends AsteroidSummary {
  orbital_elements: OrbitalElements;
  positions: AsteroidPositions;
  time_jd: number[];
}

interface ListResponse {
  data: AsteroidSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface AsteroidContextValue {
  asteroids: AsteroidSummary[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  total: number;
  search: string;
  setSearch: (value: string) => void;
  loadMore: () => void;

  selectedAsteroidId: string | null;
  selectedAsteroid: AsteroidDetail | null;
  selectedLoading: boolean;
  selectAsteroid: (id: string | null) => void;
}

const AsteroidContext = createContext<AsteroidContextValue | null>(null);

const PAGE_SIZE = 25;

export const AsteroidProvider = ({ children }: { children: ReactNode }) => {
  const [asteroids, setAsteroids] = useState<AsteroidSummary[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearchState] = useState("");

  const [selectedAsteroidId, setSelectedAsteroidId] = useState<string | null>(
    null,
  );
  const [selectedAsteroid, setSelectedAsteroid] =
    useState<AsteroidDetail | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);

  // invalidate stale in-flight requests (e.g. user typed again before a fetch resolved)
  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (targetPage: number, searchTerm: string, append: boolean) => {
      const myRequestId = ++requestId.current;
      append ? setLoadingMore(true) : setLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(targetPage),
          limit: String(PAGE_SIZE),
        });
        if (searchTerm) params.set("search", searchTerm);

        const res = await fetch(`/api/asteroids?${params.toString()}`);
        const json: ListResponse = await res.json();

        if (myRequestId !== requestId.current) return; // stale, ignore

        setAsteroids((prev) => (append ? [...prev, ...json.data] : json.data));
        setPage(json.page);
        setHasMore(json.hasMore);
        setTotal(json.total);
      } catch (err) {
        console.error("Failed to load asteroids", err);
      } finally {
        if (myRequestId === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [],
  );

  // initial load + reload whenever search changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPage(1, search, false);
  }, [search, fetchPage]);

  const loadMore = useCallback(() => {
    if (loadingMore || loading || !hasMore) return;
    fetchPage(page + 1, search, true);
  }, [fetchPage, page, search, hasMore, loadingMore, loading]);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
  }, []);

  const selectAsteroid = useCallback((id: string | null) => {
    setSelectedAsteroidId(id);
  }, []);

  useEffect(() => {
    if (!selectedAsteroidId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedAsteroid(null);
      return;
    }

    let cancelled = false;
    setSelectedLoading(true);

    fetch(`/api/asteroids/${selectedAsteroidId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch ${selectedAsteroidId}`);
        return res.json();
      })
      .then((json: AsteroidDetail) => {
        if (!cancelled) setSelectedAsteroid(json);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setSelectedAsteroid(null);
      })
      .finally(() => {
        if (!cancelled) setSelectedLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedAsteroidId]);

  return (
    <AsteroidContext.Provider
      value={{
        asteroids,
        loading,
        loadingMore,
        hasMore,
        total,
        search,
        setSearch,
        loadMore,
        selectedAsteroidId,
        selectedAsteroid,
        selectedLoading,
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
