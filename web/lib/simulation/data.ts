/* -------------------------------------------------------------------- */
/*  Data                                                                  */
/* -------------------------------------------------------------------- */

export interface BodyDef {
  name: string;
  color: string;
  radius: number; // visual radius (log-scaled, not to real scale)
  distance: number; // visual orbit radius from the sun
  speed: number; // radians / second (relative, exaggerated for visibility)
  tilt?: number; // axial tilt, purely decorative
  ring?: { inner: number; outer: number; color: string }; // Saturn
}

export const SUN = { name: "Sun", color: "#FDB813", radius: 3.2 };

export const PLANETS: BodyDef[] = [
  {
    name: "Mercury",
    color: "#9C9C94",
    radius: 0.32,
    distance: 7,
    speed: 4.1478,
  },
  { name: "Venus", color: "#E8C27A", radius: 0.5, distance: 10, speed: 1.6222 },
  { name: "Earth", color: "#3D7FD9", radius: 0.55, distance: 14, speed: 1 },
  { name: "Mars", color: "#C1502E", radius: 0.42, distance: 18, speed: 0.5312 },
  {
    name: "Jupiter",
    color: "#D8A268",
    radius: 1.7,
    distance: 26,
    speed: 0.08431,
  },
  {
    name: "Saturn",
    color: "#E3C589",
    radius: 1.45,
    distance: 34,
    speed: 0.0339,
    ring: { inner: 1.9, outer: 3.0, color: "#C9B58A" },
  },
  {
    name: "Uranus",
    color: "#9FD0DD",
    radius: 1.0,
    distance: 41,
    speed: 0.0118,
  },
  {
    name: "Neptune",
    color: "#4D72D9",
    radius: 0.97,
    distance: 48,
    speed: 0.0061,
  },
];
