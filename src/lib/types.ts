/** Capacidades individuais — cada uma liga/desliga de forma independente. */
export type Capability =
  | "gerenciar_usuarios"
  | "configurar_programas"
  | "configurar_desafios"
  | "configurar_funil"
  | "gerenciar_objetivos"
  | "excluir_itens"
  | "avaliar_ideias"
  | "acompanhar_desafios"
  | "decidir_resultado"
  | "aprovar_comunicacao";

export type FieldType = "curto" | "longo" | "unica" | "multipla";

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  options: string[];
  required: boolean;
}

export interface AppUser {
  id: string;
  name: string;
  area: string;
  capabilities: Capability[];
}

export interface EvaluatorPools {
  triagem: string[];
  tecnico: string[];
  comite: string[];
}

export type AudienceMode = "todos" | "areas" | "usuarios";

export interface Audience {
  mode: AudienceMode;
  areas: string[];
  userIds: string[];
}

/* ---------- Épico 2: funil de avaliação (pertence ao programa) ---------- */

export type StageMechanism = "nota" | "classificacao" | "gate" | "revisao";

export interface FunnelStage {
  id: string;
  name: string;
  mechanism: StageMechanism;
  readiness: string;
  ownerId: string;
  defaultDays: number;
  /** usado quando mechanism === "classificacao" */
  classificationOptions: string[];
}

export interface FunnelTransition {
  id: string;
  fromId: string;
  toId: string;
  condition: string;
}

export interface Funnel {
  stages: FunnelStage[];
  transitions: FunnelTransition[];
}

export interface Program {
  id: string;
  name: string;
  context: string;
  documentName?: string | undefined;
  resourceAmount: number;
  resourceCurrency: string;
  resourceNote: string;
  audience: Audience;
  funnel: Funnel;
  createdAt: string;
}

export interface Objective {
  id: string;
  name: string;
  description: string;
}

export type ChallengeStatus = "rascunho" | "aberto" | "pausado" | "encerrado";

/** critério de avaliação: por desafio e por etapa de mecanismo "nota" */
export interface Criterion {
  id: string;
  stageId: string;
  name: string;
  weight: number;
  scaleMax: number;
}

export type Consolidation = "media" | "ponderada" | "individual";

export interface StageConfig {
  consolidation: Consolidation;
  evaluatorsNeeded: number;
  vehicle: string;
}

export interface Challenge {
  id: string;
  programId: string;
  title: string;
  context: string;
  objectiveIds: string[];
  /** imagem de capa exibida na listagem e na página pública */
  coverUrl?: string | undefined;
  formFields: FormField[];
  kind: "pontual" | "continuo";
  deadline?: string | undefined;
  /** Sponsor / dono do desafio */
  ownerId: string;
  /** Gestor responsável pela condução */
  managerId?: string | undefined;
  /** Pool de avaliadores por tipo */
  evaluatorPools?: EvaluatorPools | undefined;
  status: ChallengeStatus;
  createdAt: string;
  /* Épico 2 */
  criteria: Criterion[];
  stageConfigs: Record<string, StageConfig>;
  evaluatorPoolIds: string[];
  committeeIds: string[];
}

export interface StageVisit {
  stageId: string;
  enteredAt: string;
  exitedAt?: string | undefined;
  movedBy?: string | undefined;
}

export interface Evaluation {
  id: string;
  stageId: string;
  evaluatorId: string;
  scores: Record<string, number>;
  comment: string;
  createdAt: string;
  updatedAt?: string | undefined;
  edited: boolean;
  locked: boolean;
  /** rascunho salvo pelo avaliador, ainda não enviado */
  draft?: boolean | undefined;
}

export interface ClassificationResult {
  stageId: string;
  option: string;
  byId: string;
  at: string;
}

export interface Decision {
  result: "aprovada" | "reprovada";
  justification: string;
  byId: string;
  at: string;
  /** ata formal, sempre gerada */
  minutes: string;
}

export interface Feedback {
  message: string;
  origin: "manual" | "ia";
  approved: boolean;
  approvedBy?: string | undefined;
  approvedAt?: string | undefined;
}

export interface Idea {
  id: string;
  challengeId: string;
  title: string;
  description: string;
  link: string;
  attachments: string[];
  answers: Record<string, string | string[]>;
  formSnapshot: FormField[];
  authorId: string;
  createdAt: string;
  /* Épico 2 */
  currentStageId?: string | undefined;
  stageHistory: StageVisit[];
  /** distribuição: avaliadores designados por etapa */
  assignments: Record<string, string[]>;
  evaluations: Evaluation[];
  classifications: ClassificationResult[];
  decision?: Decision | undefined;
  feedback?: Feedback | undefined;
}

export interface LogEntry {
  id: string;
  entityType: "programa" | "desafio" | "objetivo" | "ideia";
  entityId: string;
  entityLabel: string;
  action: string;
  detail: string;
  actor: string;
  at: string;
}
