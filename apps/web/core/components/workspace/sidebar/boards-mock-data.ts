import type { TLogoProps } from "@operoz/types";

export type TBoardSidebarMockProject = {
  id: string;
  name: string;
  identifier: string;
  logo_props: TLogoProps;
};

export type TBoardSidebarMockBoard = {
  id: string;
  name: string;
  slug: string;
  logo_props: TLogoProps;
  projects: TBoardSidebarMockProject[];
};

const defaultLogo = (emoji: string): TLogoProps => ({
  in_use: "emoji",
  emoji: { value: emoji },
});

/** Dados estáticos — substituídos pela API na Etapa 6. */
export const MOCK_SIDEBAR_BOARDS: TBoardSidebarMockBoard[] = [
  {
    id: "mock-board-squad",
    name: "Squad as a Service",
    slug: "squad-as-a-service",
    logo_props: defaultLogo("🚀"),
    projects: [
      {
        id: "mock-proj-allianz",
        name: "[Allianz] Ouvidoria",
        identifier: "ALZ",
        logo_props: defaultLogo("🏦"),
      },
      {
        id: "mock-proj-mapfre",
        name: "[MAPFRE] Agiliza Corretor",
        identifier: "MAP",
        logo_props: defaultLogo("🛡️"),
      },
    ],
  },
  {
    id: "mock-board-impl",
    name: "Implantação Esteira",
    slug: "implantacao-esteira",
    logo_props: defaultLogo("⚙️"),
    projects: [
      {
        id: "mock-proj-pipeline",
        name: "[Pipeline] CI/CD",
        identifier: "OPS",
        logo_props: defaultLogo("🔧"),
      },
    ],
  },
];

export function getMockBoardBySlug(slug: string): TBoardSidebarMockBoard | undefined {
  return MOCK_SIDEBAR_BOARDS.find((b) => b.slug === slug);
}

export const MOCK_SIDEBAR_UNASSIGNED_PROJECTS: TBoardSidebarMockProject[] = [
  {
    id: "mock-proj-legacy",
    name: "Projeto legado (sem board)",
    identifier: "LEG",
    logo_props: defaultLogo("📁"),
  },
];
