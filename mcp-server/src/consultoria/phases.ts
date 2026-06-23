export const PHASES = [
  "KICKOFF",
  "IMERSAO",
  "DESENVOLVIMENTO",
  "HOMOLOGACAO_INTERNA",
  "HOMOLOGACAO_EXTERNA",
  "DEPLOY",
  "OPERACAO_ASSISTIDA",
  "SUSTENTACAO",
] as const;

export type Phase = (typeof PHASES)[number];

export const PHASE_COLORS: Record<Phase, string> = {
  KICKOFF: "#6366f1",
  IMERSAO: "#8b5cf6",
  DESENVOLVIMENTO: "#0ea5e9",
  HOMOLOGACAO_INTERNA: "#f59e0b",
  HOMOLOGACAO_EXTERNA: "#f97316",
  DEPLOY: "#10b981",
  OPERACAO_ASSISTIDA: "#06b6d4",
  SUSTENTACAO: "#64748b",
};

export const FIXED_PHASE_TASKS: Partial<Record<Phase, string[]>> = {
  KICKOFF: ["Agendar reunião de planejamento com o cliente"],
  IMERSAO: [
    "Mapear o processo atual (AS-IS)",
    "Desenhar o AS-IS",
    "Apresentar e validar o AS-IS com o cliente",
    "Desenhar o processo futuro (TO-BE)",
    "Agendar validação do TO-BE com o webapp",
    "Apresentar e validar o TO-BE com o cliente",
    "Documentar user stories com critérios de aceite e cenários de teste",
    "Apresentar e aprovar o plano de testes com o cliente",
    "Criar os cards de homologação interna e externa",
    "Realizar handoff com o time de desenvolvimento",
  ],
  DEPLOY: [
    "Realizar handoff das esteiras para o time de suporte",
    "Compartilhar a documentação das esteiras com o suporte",
    "Estruturar o envio de dados ao cliente com o time de BI",
    "Alinhar o treinamento do cliente com o suporte",
    "Migrar as esteiras para produção",
    "Comunicar a conclusão do deploy à sustentação e ao BI",
  ],
  OPERACAO_ASSISTIDA: ["Acompanhar os tickets em operação assistida"],
  SUSTENTACAO: ["Realizar passagem de conhecimento para o time de sustentação"],
};
