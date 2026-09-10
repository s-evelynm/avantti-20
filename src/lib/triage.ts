import type { AppUser, Idea } from "./types";

/* ------------------------------------------------------------------
   Dados FIXOS de protótipo (mock). Não são calculados e não mudam se
   a ideia for editada — ficam presos ao dado de exemplo.
------------------------------------------------------------------ */

export type AdherenceLevel = "Alta" | "Média" | "Baixa";

export interface AdherenceMock {
  level: AdherenceLevel;
  note: string;
}

/** aderência ao escopo: resultado inventado por ideia de exemplo */
export const adherenceMock: Record<string, AdherenceMock> = {
  i1: { level: "Alta", note: "Ataca diretamente a falta de informação prévia na visita técnica." },
  i2: { level: "Média", note: "Resolve parte do problema, mas foge do foco de deslocamento." },
  i3: { level: "Alta", note: "Endereça o tempo de primeira resposta descrito no desafio." },
  i4: { level: "Baixa", note: "Foca em estoque interno, com pouca ligação com o desafio proposto." },
  i5: { level: "Média", note: "Ganho logístico claro, impacto no atendimento é indireto." },
  i6: { level: "Alta", note: "Boa aderência ao objetivo de reduzir custo por entrega." },
  i7: { level: "Média", note: "Padronização ajuda, mas o desafio pede ganho de tempo em campo." },
  i8: { level: "Alta", note: "Centraliza o contato com fornecedor, como o desafio pede." },
  i9: { level: "Alta", note: "Cobre o ponto crítico de qualidade citado no contexto." },
  i10: { level: "Baixa", note: "Escopo de almoxarifado, distante do problema descrito." },
  i11: { level: "Média", note: "Ajuda no autoatendimento, sem tratar a espera inicial." },
  i12: { level: "Alta", note: "Agendamento pelo cliente reduz a fila de primeiro contato." },
};

/** sugestão de quem combina com o tema: fixa por ideia de exemplo */
export const themeMatchMock: Record<string, string[]> = {
  i1: ["u5", "u7"],
  i2: ["u7", "u6"],
  i3: ["u5", "u4"],
  i4: ["u5", "u6"],
  i5: ["u7", "u4"],
  i6: ["u5", "u7"],
  i7: ["u6", "u5"],
  i8: ["u7", "u6"],
  i9: ["u5", "u7"],
  i10: ["u6", "u7"],
  i11: ["u4", "u5"],
  i12: ["u5", "u4"],
};

/** par de ideias marcadas como parecidas (totalmente inventado) */
export const duplicatePairs: [string, string][] = [["i2", "i4"]];

export function duplicateOf(ideaId: string): string | null {
  for (const [a, b] of duplicatePairs) {
    if (a === ideaId) return b;
    if (b === ideaId) return a;
  }
  return null;
}

/* ------------------------------------------------------------------
   Itens calculados de verdade
------------------------------------------------------------------ */

export interface ChecklistItem {
  label: string;
  ok: boolean;
  detail: string;
  simulated?: boolean;
}

function isValidUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function triageChecklist(idea: Idea) {
  const missing = idea.formSnapshot
    .filter((field) => field.required)
    .filter((field) => {
      const v = idea.answers[field.id];
      return Array.isArray(v) ? v.length === 0 : !String(v ?? "").trim();
    })
    .map((field) => field.label);

  const baseMissing: string[] = [];
  if (!idea.title.trim()) baseMissing.push("Título");
  if (!idea.description.trim()) baseMissing.push("Descrição");

  const allMissing = [...baseMissing, ...missing];
  const hasAttachment = idea.attachments.length > 0;
  const hasLink = isValidUrl(idea.link);

  const adherence = adherenceMock[idea.id] ?? {
    level: "Média" as AdherenceLevel,
    note: "Análise de aderência ainda não disponível para esta ideia.",
  };

  const items: ChecklistItem[] = [
    {
      label: "Campos obrigatórios preenchidos",
      ok: allMissing.length === 0,
      detail:
        allMissing.length === 0 ? "Todos preenchidos" : `Faltando: ${allMissing.join(", ")}`,
    },
    {
      label: "Anexo ou link válido",
      ok: hasAttachment || hasLink,
      detail: hasAttachment
        ? `${idea.attachments.length} anexo(s)`
        : hasLink
          ? "Link válido"
          : "Sem anexo e sem link válido",
    },
    {
      label: "Descrição com detalhamento mínimo",
      ok: idea.description.trim().length >= 80,
      detail: `${idea.description.trim().length} caracteres`,
    },
    {
      label: "Aderência ao escopo",
      ok: adherence.level !== "Baixa",
      detail: `${adherence.level} — ${adherence.note}`,
      simulated: true,
    },
  ];

  const okCount = items.filter((i) => i.ok).length;
  return {
    items,
    okCount,
    total: items.length,
    adherence,
    summary: `${okCount} de ${items.length} ok — aderência ${adherence.level}${
      adherence.level === "Baixa" ? ", revisar" : ""
    }`,
  };
}

/** carga real: quantas avaliações cada avaliador ainda tem em aberto */
export function evaluatorWorkload(ideas: Idea[], evaluatorId: string): number {
  return ideas.filter((idea) => {
    if (!idea.currentStageId) return false;
    const assigned = idea.assignments[idea.currentStageId] ?? [];
    if (!assigned.includes(evaluatorId)) return false;
    return !idea.evaluations.some(
      (e) => e.stageId === idea.currentStageId && e.evaluatorId === evaluatorId && !e.draft,
    );
  }).length;
}

export interface EvaluatorSuggestion {
  byWorkload: { id: string; open: number }[];
  byTheme: string[];
  suggestedIds: string[];
}

export function suggestEvaluators(
  idea: Idea,
  poolIds: string[],
  ideas: Idea[],
  needed: number,
): EvaluatorSuggestion {
  const byWorkload = poolIds
    .map((id) => ({ id, open: evaluatorWorkload(ideas, id) }))
    .sort((a, b) => a.open - b.open);
  const byTheme = (themeMatchMock[idea.id] ?? []).filter((id) => poolIds.includes(id));
  const suggested = [...byTheme];
  for (const w of byWorkload) {
    if (suggested.length >= Math.max(needed, byTheme.length)) break;
    if (!suggested.includes(w.id)) suggested.push(w.id);
  }
  return { byWorkload, byTheme, suggestedIds: suggested };
}

export function namesOf(users: AppUser[], ids: string[]) {
  return ids.map((id) => users.find((u) => u.id === id)?.name.split(" ")[0] ?? id);
}
