import type {
  Challenge,
  Criterion,
  Evaluation,
  Funnel,
  FunnelStage,
  Idea,
  StageConfig,
} from "./types";

export const mechanismLabel: Record<FunnelStage["mechanism"], string> = {
  nota: "Nota",
  classificacao: "Classificação",
  gate: "Gate manual",
  revisao: "Revisão livre",
};

export const consolidationLabel: Record<StageConfig["consolidation"], string> = {
  media: "Média aritmética",
  ponderada: "Média ponderada pelos pesos",
  individual: "Notas individuais (sem cálculo)",
};

export const defaultStageConfig: StageConfig = {
  consolidation: "media",
  evaluatorsNeeded: 1,
  vehicle: "",
};

export function stageConfigOf(challenge: Challenge, stageId: string): StageConfig {
  return challenge.stageConfigs[stageId] ?? defaultStageConfig;
}

export function criteriaOf(challenge: Challenge, stageId: string): Criterion[] {
  return challenge.criteria.filter((c) => c.stageId === stageId);
}

/** nota de uma avaliação individual, normalizada em 0–10 */
export function evaluationScore(
  ev: Evaluation,
  criteria: Criterion[],
  consolidation: StageConfig["consolidation"],
): number | null {
  if (criteria.length === 0) return null;
  const parts = criteria.map((c) => {
    const raw = ev.scores[c.id] ?? 0;
    return { normalized: (raw / c.scaleMax) * 10, weight: c.weight };
  });
  if (consolidation === "ponderada") {
    const totalWeight = parts.reduce((s, p) => s + p.weight, 0) || 1;
    return parts.reduce((s, p) => s + p.normalized * p.weight, 0) / totalWeight;
  }
  return parts.reduce((s, p) => s + p.normalized, 0) / parts.length;
}

export interface StageConsolidation {
  rule: StageConfig["consolidation"];
  value: number | null;
  perEvaluator: { evaluatorId: string; score: number | null }[];
}

export function consolidate(
  challenge: Challenge,
  stageId: string,
  evaluations: Evaluation[],
): StageConsolidation {
  const cfg = stageConfigOf(challenge, stageId);
  const criteria = criteriaOf(challenge, stageId);
  const stageEvals = evaluations.filter((e) => e.stageId === stageId);
  const perEvaluator = stageEvals.map((e) => ({
    evaluatorId: e.evaluatorId,
    score: evaluationScore(e, criteria, cfg.consolidation),
  }));
  if (cfg.consolidation === "individual" || perEvaluator.length === 0)
    return { rule: cfg.consolidation, value: null, perEvaluator };
  const nums = perEvaluator.map((p) => p.score ?? 0);
  return {
    rule: cfg.consolidation,
    value: nums.reduce((s, n) => s + n, 0) / nums.length,
    perEvaluator,
  };
}

/** sinal de prontidão atingido? nunca move nada — só sinaliza */
export function isReady(challenge: Challenge, stage: FunnelStage, idea: Idea): boolean {
  const cfg = stageConfigOf(challenge, stage.id);
  if (stage.mechanism === "nota") {
    const done = idea.evaluations.filter((e) => e.stageId === stage.id && !e.draft).length;
    return done >= cfg.evaluatorsNeeded;
  }
  if (stage.mechanism === "classificacao")
    return idea.classifications.some((c) => c.stageId === stage.id);
  if (stage.mechanism === "gate") return !!idea.decision;
  return true;
}

/** próximas etapas possíveis a partir da etapa atual, respeitando condições */
export function nextStages(funnel: Funnel, idea: Idea): { stage: FunnelStage; condition: string }[] {
  if (!idea.currentStageId) return [];
  const currentId = idea.currentStageId;
  const classification = idea.classifications.find((c) => c.stageId === currentId)?.option;
  return funnel.transitions
    .filter((t) => t.fromId === currentId)
    .map((t) => {
      const stage = funnel.stages.find((s) => s.id === t.toId);
      return stage ? { stage, condition: t.condition } : null;
    })
    .filter((x): x is { stage: FunnelStage; condition: string } => x !== null)
    .filter((x) => {
      if (!x.condition) return true;
      const match = /"([^"]+)"/.exec(x.condition);
      if (!match) return true;
      return classification === match[1];
    });
}

/** dias restantes do prazo da etapa atual (entrada na etapa + prazo padrão) */
export function daysLeftInStage(idea: Idea, stage: FunnelStage): number | null {
  const visit = [...idea.stageHistory].reverse().find((v) => v.stageId === stage.id && !v.exitedAt);
  if (!visit) return null;
  const due = new Date(visit.enteredAt).getTime() + stage.defaultDays * 24 * 60 * 60 * 1000;
  return Math.ceil((due - Date.now()) / (24 * 60 * 60 * 1000));
}

export function formatScore(v: number | null) {
  return v === null ? "—" : v.toFixed(1).replace(".", ",");
}
