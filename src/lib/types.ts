export type Role = "admin" | "gestor" | "usuario";

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
  role: Role;
}

export type AudienceMode = "todos" | "areas" | "usuarios";

export interface Audience {
  mode: AudienceMode;
  areas: string[];
  userIds: string[];
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
  createdAt: string;
}

export interface Objective {
  id: string;
  name: string;
  description: string;
}

export type ChallengeStatus = "rascunho" | "aberto" | "pausado" | "encerrado";

export interface Challenge {
  id: string;
  programId: string;
  title: string;
  context: string;
  objectiveIds: string[];
  formFields: FormField[];
  kind: "pontual" | "continuo";
  deadline?: string | undefined;
  ownerId: string;
  status: ChallengeStatus;
  createdAt: string;
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
