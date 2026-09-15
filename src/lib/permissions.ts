import type { AppUser, Capability } from "./types";

export const CONFIG_CAPABILITIES: Capability[] = [
  "gerenciar_usuarios",
  "configurar_programas",
  "configurar_desafios",
  "configurar_funil",
  "gerenciar_objetivos",
  "excluir_itens",
];

export const PROCESS_CAPABILITIES: Capability[] = [
  "avaliar_ideias",
  "acompanhar_desafios",
  "decidir_resultado",
  "aprovar_comunicacao",
];

export const capabilityLabel: Record<Capability, string> = {
  gerenciar_usuarios: "Gerenciar usuários e permissões",
  configurar_programas: "Configurar programas",
  configurar_desafios: "Configurar desafios",
  configurar_funil: "Configurar funil de avaliação",
  gerenciar_objetivos: "Gerenciar objetivos estratégicos",
  excluir_itens: "Excluir programas e desafios",
  avaliar_ideias: "Avaliar ideias",
  acompanhar_desafios: "Acompanhar desafios",
  decidir_resultado: "Decidir resultado final de ideias",
  aprovar_comunicacao: "Aprovar envio de comunicação",
};

export const capabilityHint: Partial<Record<Capability, string>> = {
  gerenciar_usuarios: "Abre a gestão de usuários e a edição de capacidades.",
  configurar_programas: "Cria e edita programas, público elegível e recursos.",
  configurar_desafios: "Cria e edita desafios, formulários e critérios.",
  configurar_funil: "Edita as etapas e transições do funil do programa.",
  gerenciar_objetivos: "Cria, edita e exclui objetivos estratégicos.",
  excluir_itens: "Permite excluir programas e desafios já criados.",
};

export function has(user: AppUser | undefined, cap: Capability) {
  return !!user?.capabilities.includes(cap);
}

/** Papéis atribuíveis dentro do desafio e a capacidade que cada um pressupõe. */
export const challengeRoleRequirement = {
  sponsor: { label: "Sponsor / dono", capability: "decidir_resultado" as Capability },
  gestor: { label: "Gestor responsável", capability: "acompanhar_desafios" as Capability },
  triagem: { label: "Avaliadores de triagem", capability: "avaliar_ideias" as Capability },
  tecnico: { label: "Avaliadores técnicos", capability: "avaliar_ideias" as Capability },
  comite: { label: "Comitê", capability: "decidir_resultado" as Capability },
} as const;

export type ChallengeRoleKey = keyof typeof challengeRoleRequirement;
