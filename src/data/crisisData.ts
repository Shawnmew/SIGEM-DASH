export type CrisisSeverity = "critical" | "high" | "medium" | "low";
export type CrisisStatus = "active" | "monitoring" | "responding" | "resolved";
export type CrisisType = "flood" | "fire" | "earthquake" | "epidemic" | "drought" | "storm" | "landslide" | "other";

export interface Crisis {
  id: string;
  title: string;
  description: string;
  type: CrisisType;
  severity: CrisisSeverity;
  status: CrisisStatus;
  region: string;
  province: string;
  reportedAt: string;
  affectedPeople: number;
  volunteersAssigned: number;
  lat?: number;
  lng?: number;
}

export const crisisTypeLabels: Record<CrisisType, string> = {
  flood: "Inundação",
  fire: "Incêndio",
  earthquake: "Terramoto",
  epidemic: "Epidemia",
  drought: "Seca",
  storm: "Tempestade",
  landslide: "Deslizamento",
  other: "Outro",
};

export const severityLabels: Record<CrisisSeverity, string> = {
  critical: "Crítico",
  high: "Alto",
  medium: "Médio",
  low: "Baixo",
};

export const statusLabels: Record<CrisisStatus, string> = {
  active: "Ativa",
  monitoring: "Monitorando",
  responding: "Em Resposta",
  resolved: "Resolvida",
};

export const mockCrises: Crisis[] = [
  {
    id: "1",
    title: "Inundação severa em Luanda",
    description: "Chuvas intensas causaram inundações em múltiplos bairros da capital.",
    type: "flood",
    severity: "critical",
    status: "responding",
    region: "Luanda",
    province: "Luanda",
    reportedAt: "2026-02-20T08:30:00",
    affectedPeople: 15000,
    volunteersAssigned: 120,
    lat: -8.839,
    lng: 13.289,
  },
  {
    id: "2",
    title: "Incêndio florestal em Huíla",
    description: "Incêndio de grandes proporções afeta zona rural da província.",
    type: "fire",
    severity: "high",
    status: "active",
    region: "Lubango",
    province: "Huíla",
    reportedAt: "2026-02-19T14:00:00",
    affectedPeople: 3200,
    volunteersAssigned: 45,
    lat: -14.917,
    lng: 13.500,
  },
  {
    id: "3",
    title: "Surto de cólera em Benguela",
    description: "Aumento de casos de cólera em comunidades costeiras.",
    type: "epidemic",
    severity: "high",
    status: "responding",
    region: "Benguela",
    province: "Benguela",
    reportedAt: "2026-02-18T09:15:00",
    affectedPeople: 800,
    volunteersAssigned: 30,
    lat: -12.578,
    lng: 13.405,
  },
  {
    id: "4",
    title: "Deslizamento de terra no Uíge",
    description: "Deslizamento de terra após chuvas fortes na região montanhosa.",
    type: "landslide",
    severity: "medium",
    status: "monitoring",
    region: "Uíge",
    province: "Uíge",
    reportedAt: "2026-02-17T16:45:00",
    affectedPeople: 500,
    volunteersAssigned: 15,
    lat: -7.609,
    lng: 15.061,
  },
  {
    id: "5",
    title: "Seca prolongada no Cunene",
    description: "Seca severa afeta produção agrícola e acesso à água potável.",
    type: "drought",
    severity: "medium",
    status: "active",
    region: "Ondjiva",
    province: "Cunene",
    reportedAt: "2026-02-10T11:00:00",
    affectedPeople: 25000,
    volunteersAssigned: 60,
    lat: -17.067,
    lng: 15.733,
  },
  {
    id: "6",
    title: "Tempestade tropical em Cabinda",
    description: "Ventos fortes e chuvas intensas atingem a região costeira.",
    type: "storm",
    severity: "low",
    status: "resolved",
    region: "Cabinda",
    province: "Cabinda",
    reportedAt: "2026-02-15T07:30:00",
    affectedPeople: 200,
    volunteersAssigned: 10,
    lat: -5.556,
    lng: 12.200,
  },
];
