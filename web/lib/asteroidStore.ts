import fs from "fs";
import path from "path";

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

interface RawAsteroidBody {
  name: string;
  type: string;
  pha: boolean;
  diameter_km: number | null;
  color: string;
  orbital_elements: OrbitalElements;
  positions: AsteroidPositions;
}

interface RawAsteroidsFile {
  metadata: Record<string, unknown>;
  time_jd: number[];
  bodies: Record<string, RawAsteroidBody>;
}

interface RiskEntry {
  spkid: number;
  full_name: string;
  designation: string;
  close_approach_date: string;
  year: number;
  a: number;
  e: number;
  i: number;
  q: number;
  ad: number;
  per_y: number;
  moid_au: number;
  H: number;
  diameter_km: number | null;
  distance_au: number;
  velocity_km_s: number;
  condition_code: number;
  pha: number;
  predicted_hazard_probability: number;
  predicted_moid_au: number;
  risk_score: number;
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
  risk?: RiskEntry;
}

let cachedSummaries: AsteroidSummary[] | null = null;
let cachedRawBodies: Record<string, RawAsteroidBody> | null = null;
let cachedRiskById: Map<string, RiskEntry> | null = null;
let cachedTimeJd: number[] | null = null;

function loadRaw() {
  if (cachedRawBodies && cachedTimeJd) return;

  const asteroidsPath = path.join(process.cwd(), "data", "asteroids.json");
  const riskPath = path.join(process.cwd(), "data", "predictions.json");

  const asteroidsFile: RawAsteroidsFile = JSON.parse(
    fs.readFileSync(asteroidsPath, "utf-8"),
  );
  const riskFile: RiskEntry[] = JSON.parse(fs.readFileSync(riskPath, "utf-8"));

  cachedRawBodies = asteroidsFile.bodies;
  cachedTimeJd = asteroidsFile.time_jd;

  cachedRiskById = new Map();
  for (const entry of riskFile) {
    // "designation" matches the key used in asteroids.json's `bodies` map
    const existing = cachedRiskById.get(entry.designation);
    // if a body has multiple close-approach rows, keep the highest risk one
    if (!existing || entry.risk_score > existing.risk_score) {
      cachedRiskById.set(entry.designation, entry);
    }
  }
}

function buildSummaries(): AsteroidSummary[] {
  if (cachedSummaries) return cachedSummaries;
  loadRaw();

  const summaries: AsteroidSummary[] = Object.entries(cachedRawBodies!).map(
    ([id, body]) => {
      const risk = cachedRiskById!.get(id);
      return {
        id,
        name: body.name,
        type: body.type,
        pha: body.pha,
        diameter_km: body.diameter_km,
        color: body.color,
        risk_score: risk?.risk_score ?? 0,
        predicted_hazard_probability:
          risk?.predicted_hazard_probability ?? null,
        close_approach_date: risk?.close_approach_date ?? null,
      };
    },
  );

  // index ordered by risk_score descending
  summaries.sort((a, b) => b.risk_score - a.risk_score);

  cachedSummaries = summaries;
  return summaries;
}

export interface ListAsteroidsParams {
  page: number;
  limit: number;
  search?: string;
}

export interface ListAsteroidsResult {
  data: AsteroidSummary[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export function listAsteroids({
  page,
  limit,
  search,
}: ListAsteroidsParams): ListAsteroidsResult {
  const all = buildSummaries();

  const filtered = search
    ? all.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
    : all;

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  const end = start + limit;

  return {
    data: filtered.slice(start, end),
    page: safePage,
    limit,
    total,
    totalPages,
    hasMore: end < total,
  };
}

export function getAsteroidDetail(id: string): AsteroidDetail | null {
  loadRaw();
  const body = cachedRawBodies?.[id];
  if (!body) return null;

  const risk = cachedRiskById!.get(id);

  return {
    id,
    name: body.name,
    type: body.type,
    pha: body.pha,
    diameter_km: body.diameter_km,
    color: body.color,
    risk_score: risk?.risk_score ?? 0,
    predicted_hazard_probability: risk?.predicted_hazard_probability ?? null,
    close_approach_date: risk?.close_approach_date ?? null,
    orbital_elements: body.orbital_elements,
    positions: body.positions,
    risk,
  };
}

export function getTimeJd(): number[] {
  loadRaw();
  return cachedTimeJd!;
}
