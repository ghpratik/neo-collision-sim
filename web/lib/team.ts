export type TeamMember = {
  name: string;
  role: string;
  focus: string;
  initials: string;
};

// Update these with your actual team details.
export const team: TeamMember[] = [
  {
    name: "Team Member One",
    role: "Lead / Orbital Mechanics",
    focus: "Trajectory modeling & impact probability",
    initials: "M1",
  },
  {
    name: "Team Member Two",
    role: "3D Simulation Engineer",
    focus: "React Three Fiber rendering & data viz",
    initials: "M2",
  },
  {
    name: "Team Member Three",
    role: "Data & Forecasting",
    focus: "NEO datasets & collision prediction",
    initials: "M3",
  },
];
