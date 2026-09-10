import type { Challenge, FormField } from "./types";

// Todas as respostas de IA deste protótipo são simuladas (pré-definidas)
// e SEMPRE passam por aprovação/edição humana antes de salvar.

export interface ProgramDraft {
  name: string;
  context: string;
  resourceAmount: number;
  resourceNote: string;
}

export function aiProgramFromDocument(fileName: string): ProgramDraft {
  return {
    name: "Programa de Eficiência e Digitalização",
    context: `Leitura simulada de "${fileName}". O documento descreve um programa corporativo de inovação com foco em digitalizar processos internos, reduzir retrabalho e ampliar a participação das áreas operacionais. Sugerimos ciclos trimestrais de submissão e avaliação, com desafios temáticos por área.`,
    resourceAmount: 500000,
    resourceNote: "Valor sugerido pela leitura do documento — confirme com o comitê antes de publicar.",
  };
}

export interface ChallengeDraft {
  title: string;
  context: string;
  suggestedFields: FormField[];
}

export function aiChallengeFromText(text: string): ChallengeDraft {
  const seedText = text.trim().slice(0, 120);
  return {
    title: "Como podemos reduzir o retrabalho no processo descrito?",
    context: `Rascunho gerado a partir do texto informado ("${seedText}${text.length > 120 ? "…" : ""}"). O desafio convida colaboradores a propor soluções que ataquem as causas raiz do problema, com foco em ganho mensurável em até 90 dias.`,
    suggestedFields: [
      { id: "ai1", label: "Qual causa raiz sua ideia ataca?", type: "longo", options: [], required: true },
      { id: "ai2", label: "Nível de maturidade", type: "unica", options: ["Conceito", "Protótipo", "Piloto rodando"], required: true },
      { id: "ai3", label: "Recursos necessários", type: "multipla", options: ["Time dedicado", "Orçamento", "Parceiro externo"], required: false },
    ],
  };
}

export interface ReviewItem {
  level: "lacuna" | "sugestao";
  title: string;
  detail: string;
}

export function aiReviewChallenge(c: {
  title: string;
  context: string;
  objectiveIds: string[];
  formFields: FormField[];
  kind: Challenge["kind"];
  deadline?: string;
  ownerId: string;
}): ReviewItem[] {
  const items: ReviewItem[] = [];
  if (c.context.trim().length < 180)
    items.push({
      level: "lacuna",
      title: "Contexto curto",
      detail: "O contexto tem menos de 180 caracteres. Descreva o problema, os dados que o comprovam e o resultado esperado.",
    });
  if (c.objectiveIds.length === 0)
    items.push({ level: "lacuna", title: "Sem objetivo estratégico", detail: "Vincule ao menos um objetivo estratégico ao desafio." });
  if (!c.ownerId)
    items.push({ level: "lacuna", title: "Sem dono/sponsor", detail: "Defina quem responde por este desafio." });
  if (c.kind === "pontual" && !c.deadline)
    items.push({ level: "lacuna", title: "Prazo ausente", detail: "Desafios pontuais precisam de prazo de encerramento das submissões." });
  if (c.formFields.length === 0)
    items.push({
      level: "sugestao",
      title: "Formulário só com campos fixos",
      detail: "Considere adicionar ao menos uma pergunta específica para facilitar a avaliação comparativa.",
    });
  if (!/\?$/.test(c.title.trim()))
    items.push({
      level: "sugestao",
      title: "Título em forma de pergunta",
      detail: 'Desafios convertem melhor quando escritos como pergunta, no formato "Como podemos…?".',
    });
  items.push({
    level: "sugestao",
    title: "Revisão de escrita (simulada)",
    detail: "Texto claro no geral. Evite siglas internas sem explicação e prefira frases curtas na descrição do problema.",
  });
  return items;
}
