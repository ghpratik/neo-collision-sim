export type TeamMember = {
  name: string;
  role: string;
  focus: string;
  initials: string;
};

// Update these with your actual team details.
export const team: TeamMember[] = [
  {
    name: "Raman Jangam",
    role: "Student at ISM",
    focus: "NEO datasets & collision prediction",
    initials: "RJ",
  },
  {
    name: "Pratik Gaikwad",
    role: "Student at ISM",
    focus: "Real-time rendering & physics simulation",
    initials: "PG",
  },
  {
    name: "Satyam Satyarthi",
    role: "Student at ISM",
    focus: "Trajectory modeling & impact probability",
    initials: "SS",
  },
];
