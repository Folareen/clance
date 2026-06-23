export type Member = { name: string; initials: string; role: "manager" | "worker" };

export type Project = {
  id: string;
  name: string;
  description: string;
  color: string;
  cover?: string;
  progress: number;
  tasks: { done: number; total: number };
  members: Member[];
  role: "manager" | "worker";
};

export const projects: Project[] = [
  {
    id: "mobile-app",
    name: "Mobile App Redesign",
    description: "Complete UI overhaul for iOS and Android",
    color: "#7c3aed",
    cover: "https://picsum.photos/seed/mobile-app/160",
    progress: 68,
    tasks: { done: 17, total: 25 },
    role: "manager",
    members: [
      { name: "Sarah Chen", initials: "SC", role: "worker" },
      { name: "Mike Johnson", initials: "MJ", role: "worker" },
      { name: "Emma Walsh", initials: "EW", role: "worker" },
    ],
  },
  {
    id: "api-integration",
    name: "API Integration",
    description: "Third-party payment and analytics APIs",
    color: "#3b82f6",
    cover: "https://picsum.photos/seed/api-integration/160",
    progress: 45,
    tasks: { done: 9, total: 20 },
    role: "manager",
    members: [
      { name: "Ade Kunle", initials: "AK", role: "worker" },
      { name: "Sarah Chen", initials: "SC", role: "worker" },
      { name: "Mike Johnson", initials: "MJ", role: "manager" },
      { name: "Rashid Diallo", initials: "RD", role: "worker" },
    ],
  },
  {
    id: "marketing-site",
    name: "Marketing Website",
    description: "Landing pages and SEO optimization",
    color: "#10b981",
    cover: "https://picsum.photos/seed/marketing-site/160",
    progress: 92,
    tasks: { done: 23, total: 25 },
    role: "worker",
    members: [
      { name: "Emma Walsh", initials: "EW", role: "manager" },
      { name: "Lola Peters", initials: "LP", role: "worker" },
    ],
  },
  {
    id: "brand-guidelines",
    name: "Brand Guidelines",
    description: "Design system and brand documentation",
    color: "#f59e0b",
    progress: 23,
    tasks: { done: 3, total: 13 },
    role: "worker",
    members: [
      { name: "Lola Peters", initials: "LP", role: "manager" },
      { name: "Sarah Chen", initials: "SC", role: "worker" },
      { name: "Ade Kunle", initials: "AK", role: "worker" },
    ],
  },
];

export function getProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

export const currentUser = {
  name: "Saka Wahab",
  initials: "SA",
  email: "sakawahab03@gmail.com",
};
