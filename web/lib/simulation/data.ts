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
  texture?: {
    day?: string;
    ring?: string;
  };
}

export interface EarthDef {
  name: string;
  color: string;
  radius: number; // visual radius (log-scaled, not to real scale)
  distance: number; // visual orbit radius from the sun
  speed: number; // radians / second (relative, exaggerated for visibility)
  tilt?: number; // axial tilt, purely decorative
  texture: {
    day: string;
    night: string;
  };
}

export const SUN = { name: "Sun", color: "#FDB813", radius: 5 };

export const EARTH: EarthDef = {
  name: "Earth",
  color: "#3D7FD9",
  radius: 0.55,
  distance: 14.96,
  speed: 1,
  texture: {
    day: "/textures/earth_daymap.jpg",
    night: "/textures/earth_nightmap.jpg",
  },
};

export const MOON: EarthDef = {
  name: "Moon",
  color: "#888888",
  radius: 0.15,
  distance: 2,
  speed: 1.6,
  texture: {
    day: "/textures/moon.jpg",
    night: "/textures/moon.jpg",
  },
};

export const PLANETS: BodyDef[] = [
  {
    name: "Mercury",
    color: "#33332c",
    radius: 0.32,
    distance: 7,
    speed: 4.1478,
    texture: {
      day: "/textures/mercury.jpg",
    },
  },
  {
    name: "Venus",
    color: "#241b0b",
    radius: 0.5,
    distance: 10,
    speed: 1.6222,
    texture: {
      day: "/textures/venus.jpg",
    },
  },
  {
    name: "Mars",
    color: "#1c0c06",
    radius: 0.42,
    distance: 20,
    speed: 0.5312,
    texture: {
      day: "/textures/mars.jpg",
    },
  },
  {
    name: "Jupiter",
    color: "#1f150b",
    radius: 1.7,
    distance: 28,
    speed: 0.08431,
    texture: {
      day: "/textures/jupiter.jpg",
    },
  },
  {
    name: "Saturn",
    color: "#1f1a0f",
    radius: 1.45,
    distance: 36,
    speed: 0.0339,
    ring: { inner: 1.9, outer: 3.0, color: "#C9B58A" },
    texture: {
      day: "/textures/saturn.jpg",
      ring: "/textures/saturn_ring.png",
    },
  },
  {
    name: "Uranus",
    color: "#151f21",
    radius: 1.0,
    distance: 45,
    speed: 0.0118,
    texture: {
      day: "/textures/uranus.jpg",
    },
  },
  {
    name: "Neptune",
    color: "#0c1224",
    radius: 0.97,
    distance: 53,
    speed: 0.0061,
    texture: {
      day: "/textures/neptune.jpg",
    },
  },
];
