import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AREAS,
  USERS,
  seedChallenges,
  seedIdeas,
  seedLogs,
  seedObjectives,
  seedPrograms,
} from "./seed";
import type {
  AppUser,
  Capability,
  Challenge,
  ChallengeStatus,
  Funnel,
  Idea,
  LogEntry,
  Objective,
  Program,
} from "./types";
import { CONFIG_CAPABILITIES } from "./permissions";

const uid = () => Math.random().toString(36).slice(2, 10);

export interface Capabilities {
  /** todo mundo participa: ver desafios, página pública e enviar ideias */
  participar: boolean;
  avaliar: boolean;
  /** acompanhar desafios (painel) */
  gerenciar: boolean;
  /** qualquer capacidade de configuração */
  configurar: boolean;
  gerenciarUsuarios: boolean;
  configurarProgramas: boolean;
  configurarDesafios: boolean;
  configurarFunil: boolean;
  gerenciarObjetivos: boolean;
  excluirItens: boolean;
  decidirResultado: boolean;
  aprovarComunicacao: boolean;
}

interface Ctx {
  viewAsId: string;
  setViewAs: (id: string) => void;
  caps: Capabilities;
  has: (cap: Capability) => boolean;
  currentUser: { id: string; name: string };
  areas: string[];
  users: AppUser[];
  updateUserCapabilities: (userId: string, capabilities: Capability[]) => void;
  programs: Program[];
  objectives: Objective[];
  challenges: Challenge[];
  ideas: Idea[];
  logs: LogEntry[];
  addProgram: (p: Omit<Program, "id" | "createdAt" | "funnel">, origin?: string) => Program;
  updateProgram: (id: string, patch: Partial<Program>, what: string) => void;
  deleteProgram: (id: string) => void;
  addObjective: (o: Omit<Objective, "id">) => void;
  updateObjective: (id: string, patch: Partial<Objective>) => void;
  deleteObjective: (id: string) => void;
  objectiveInUse: (id: string) => boolean;
  addChallenge: (
    c: Omit<
      Challenge,
      "id" | "createdAt" | "status" | "criteria" | "stageConfigs" | "evaluatorPoolIds" | "committeeIds"
    >,
    origin?: string,
  ) => Challenge;
  updateChallenge: (id: string, patch: Partial<Challenge>, what: string) => void;
  setChallengeStatus: (id: string, status: ChallengeStatus) => void;
  deleteChallenge: (id: string) => void;
  addIdea: (
    i: Omit<
      Idea,
      "id" | "createdAt" | "stageHistory" | "assignments" | "evaluations" | "classifications"
    >,
  ) => void;
  logsFor: (entityId: string) => LogEntry[];
  visiblePrograms: (userId: string) => Program[];
  /* ---------- Épico 2 ---------- */
  funnelOfChallenge: (challengeId: string) => Funnel;
  updateFunnel: (programId: string, funnel: Funnel, what: string) => void;
  assignEvaluators: (ideaId: string, stageId: string, evaluatorIds: string[]) => void;
  saveEvaluation: (
    ideaId: string,
    stageId: string,
    scores: Record<string, number>,
    comment: string,
    draft?: boolean,
  ) => void;
  classifyIdea: (ideaId: string, stageId: string, option: string) => void;
  advanceIdea: (ideaId: string, toStageId: string) => void;
  decideIdea: (ideaId: string, result: "aprovada" | "reprovada", justification: string) => void;
  setIdeaFeedback: (ideaId: string, message: string, origin: "manual" | "ia") => void;
  approveFeedback: (ideaId: string) => void;
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [viewAsId, setViewAs] = useState("u1");
  const [users, setUsers] = useState<AppUser[]>(USERS);
  const [programs, setPrograms] = useState<Program[]>(seedPrograms);
  const [objectives, setObjectives] = useState<Objective[]>(seedObjectives);
  const [challenges, setChallenges] = useState<Challenge[]>(seedChallenges);
  const [ideas, setIdeas] = useState<Idea[]>(seedIdeas);
  const [logs, setLogs] = useState<LogEntry[]>(seedLogs);

  const viewer = users.find((u) => u.id === viewAsId) ?? users[0]!;
  const currentUser = useMemo(() => ({ id: viewer.id, name: viewer.name }), [viewer.id, viewer.name]);
  const has = (cap: Capability) => viewer.capabilities.includes(cap);


  const log = useCallback(
    (entry: Omit<LogEntry, "id" | "at" | "actor">, actor: string) => {
      setLogs((prev) => [
        { ...entry, id: uid(), at: new Date().toISOString(), actor },
        ...prev,
      ]);
    },
    [],
  );

  const addProgram: Ctx["addProgram"] = (p, origin = "Criação manual do programa.") => {
    const program: Program = {
      ...p,
      id: uid(),
      funnel: { stages: [], transitions: [] },
      createdAt: new Date().toISOString(),
    };
    setPrograms((prev) => [program, ...prev]);
    log(
      {
        entityType: "programa",
        entityId: program.id,
        entityLabel: program.name,
        action: "Programa criado",
        detail: origin,
      },
      currentUser.name,
    );
    return program;
  };

  const updateProgram: Ctx["updateProgram"] = (id, patch, what) => {
    setPrograms((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    const label = programs.find((p) => p.id === id)?.name ?? "";
    log(
      { entityType: "programa", entityId: id, entityLabel: label, action: "Programa editado", detail: what },
      currentUser.name,
    );
  };

  const deleteProgram: Ctx["deleteProgram"] = (id) => {
    const label = programs.find((p) => p.id === id)?.name ?? "";
    const removed = challenges.filter((c) => c.programId === id).map((c) => c.id);
    setPrograms((prev) => prev.filter((p) => p.id !== id));
    setChallenges((prev) => prev.filter((c) => c.programId !== id));
    setIdeas((prev) => prev.filter((i) => !removed.includes(i.challengeId)));
    log(
      {
        entityType: "programa",
        entityId: id,
        entityLabel: label,
        action: "Programa excluído",
        detail: `${removed.length} desafio(s) e as ideias vinculadas foram excluídos junto.`,
      },
      currentUser.name,
    );
  };

  const addObjective: Ctx["addObjective"] = (o) => {
    const obj = { ...o, id: uid() };
    setObjectives((prev) => [...prev, obj]);
    log(
      { entityType: "objetivo", entityId: obj.id, entityLabel: obj.name, action: "Objetivo criado", detail: obj.description },
      currentUser.name,
    );
  };

  const updateObjective: Ctx["updateObjective"] = (id, patch) => {
    setObjectives((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
    log(
      {
        entityType: "objetivo",
        entityId: id,
        entityLabel: patch.name ?? objectives.find((o) => o.id === id)?.name ?? "",
        action: "Objetivo editado",
        detail: "Nome e/ou descrição atualizados.",
      },
      currentUser.name,
    );
  };

  const deleteObjective: Ctx["deleteObjective"] = (id) => {
    const label = objectives.find((o) => o.id === id)?.name ?? "";
    setObjectives((prev) => prev.filter((o) => o.id !== id));
    log(
      { entityType: "objetivo", entityId: id, entityLabel: label, action: "Objetivo excluído", detail: "Não estava vinculado a nenhum desafio." },
      currentUser.name,
    );
  };

  const objectiveInUse = (id: string) => challenges.some((c) => c.objectiveIds.includes(id));

  const addChallenge: Ctx["addChallenge"] = (c, origin = "Criação manual do desafio.") => {
    const challenge: Challenge = {
      ...c,
      id: uid(),
      status: "rascunho",
      criteria: [],
      stageConfigs: {},
      evaluatorPoolIds: [],
      committeeIds: [],
      createdAt: new Date().toISOString(),
    };
    setChallenges((prev) => [challenge, ...prev]);
    log(
      {
        entityType: "desafio",
        entityId: challenge.id,
        entityLabel: challenge.title,
        action: "Desafio criado",
        detail: `${origin} Estado inicial: Rascunho.`,
      },
      currentUser.name,
    );
    return challenge;
  };

  const updateChallenge: Ctx["updateChallenge"] = (id, patch, what) => {
    setChallenges((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    const label = patch.title ?? challenges.find((c) => c.id === id)?.title ?? "";
    log(
      { entityType: "desafio", entityId: id, entityLabel: label, action: "Desafio editado", detail: what },
      currentUser.name,
    );
  };

  const setChallengeStatus: Ctx["setChallengeStatus"] = (id, status) => {
    const before = challenges.find((c) => c.id === id);
    setChallenges((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    log(
      {
        entityType: "desafio",
        entityId: id,
        entityLabel: before?.title ?? "",
        action: "Status alterado",
        detail: `De ${statusLabel(before?.status ?? "rascunho")} para ${statusLabel(status)}.`,
      },
      currentUser.name,
    );
  };

  const deleteChallenge: Ctx["deleteChallenge"] = (id) => {
    const label = challenges.find((c) => c.id === id)?.title ?? "";
    const count = ideas.filter((i) => i.challengeId === id).length;
    setChallenges((prev) => prev.filter((c) => c.id !== id));
    setIdeas((prev) => prev.filter((i) => i.challengeId !== id));
    log(
      {
        entityType: "desafio",
        entityId: id,
        entityLabel: label,
        action: "Desafio excluído",
        detail: `${count} ideia(s) vinculada(s) foram excluídas junto.`,
      },
      currentUser.name,
    );
  };

  const addIdea: Ctx["addIdea"] = (i) => {
    const program = programs.find((p) => p.id === challenges.find((c) => c.id === i.challengeId)?.programId);
    const firstStage = program?.funnel.stages[0];
    const idea: Idea = {
      ...i,
      id: uid(),
      createdAt: new Date().toISOString(),
      currentStageId: firstStage?.id,
      stageHistory: firstStage ? [{ stageId: firstStage.id, enteredAt: new Date().toISOString() }] : [],
      assignments: {},
      evaluations: [],
      classifications: [],
    };
    setIdeas((prev) => [idea, ...prev]);
    log(
      { entityType: "ideia", entityId: idea.challengeId, entityLabel: idea.title, action: "Ideia submetida", detail: "Submissão registrada com a estrutura atual do formulário." },
      currentUser.name,
    );
  };

  /* ---------------- Épico 2: processo de avaliação ---------------- */

  const emptyFunnel: Funnel = { stages: [], transitions: [] };

  const funnelOfChallenge: Ctx["funnelOfChallenge"] = (challengeId) => {
    const ch = challenges.find((c) => c.id === challengeId);
    return programs.find((p) => p.id === ch?.programId)?.funnel ?? emptyFunnel;
  };

  const updateFunnel: Ctx["updateFunnel"] = (programId, funnel, what) => {
    setPrograms((prev) => prev.map((p) => (p.id === programId ? { ...p, funnel } : p)));
    log(
      {
        entityType: "programa",
        entityId: programId,
        entityLabel: programs.find((p) => p.id === programId)?.name ?? "",
        action: "Funil de avaliação alterado",
        detail: what,
      },
      currentUser.name,
    );
  };

  const ideaLog = (idea: Idea, action: string, detail: string) =>
    log(
      { entityType: "ideia", entityId: idea.challengeId, entityLabel: idea.title, action, detail },
      currentUser.name,
    );

  const assignEvaluators: Ctx["assignEvaluators"] = (ideaId, stageId, evaluatorIds) => {
    const idea = ideas.find((i) => i.id === ideaId);
    setIdeas((prev) =>
      prev.map((i) =>
        i.id === ideaId ? { ...i, assignments: { ...i.assignments, [stageId]: evaluatorIds } } : i,
      ),
    );
    if (idea)
      ideaLog(
        idea,
        "Distribuição atualizada",
        `${evaluatorIds.length} avaliador(es) designado(s) para a etapa atual: ${evaluatorIds
          .map((id) => USERS.find((u) => u.id === id)?.name ?? id)
          .join(", ") || "nenhum"}.`,
      );
  };

  const saveEvaluation: Ctx["saveEvaluation"] = (ideaId, stageId, scores, comment, draft = false) => {
    const idea = ideas.find((i) => i.id === ideaId);
    const now = new Date().toISOString();
    let wasEdit = false;
    setIdeas((prev) =>
      prev.map((i) => {
        if (i.id !== ideaId) return i;
        const existing = i.evaluations.find(
          (e) => e.stageId === stageId && e.evaluatorId === viewer.id,
        );
        if (existing?.locked) return i;
        wasEdit = !!existing && !existing.draft;
        const evaluations = existing
          ? i.evaluations.map((e) =>
              e.id === existing.id
                ? { ...e, scores, comment, updatedAt: now, edited: wasEdit, draft }
                : e,
            )
          : [
              ...i.evaluations,
              {
                id: uid(),
                stageId,
                evaluatorId: viewer.id,
                scores,
                comment,
                createdAt: now,
                edited: false,
                locked: false,
                draft,
              },
            ];
        return { ...i, evaluations };
      }),
    );
    if (idea && !draft)
      ideaLog(
        idea,
        wasEdit ? "Avaliação editada" : "Avaliação registrada",
        `${currentUser.name} ${wasEdit ? "alterou" : "registrou"} notas e comentário na etapa atual.`,
      );
  };


  const classifyIdea: Ctx["classifyIdea"] = (ideaId, stageId, option) => {
    const idea = ideas.find((i) => i.id === ideaId);
    setIdeas((prev) =>
      prev.map((i) =>
        i.id === ideaId
          ? {
              ...i,
              classifications: [
                ...i.classifications.filter((c) => c.stageId !== stageId),
                { stageId, option, byId: viewer.id, at: new Date().toISOString() },
              ],
            }
          : i,
      ),
    );
    if (idea) ideaLog(idea, "Classificação registrada", `Opção escolhida: ${option}.`);
  };

  const advanceIdea: Ctx["advanceIdea"] = (ideaId, toStageId) => {
    const idea = ideas.find((i) => i.id === ideaId);
    const now = new Date().toISOString();
    setIdeas((prev) =>
      prev.map((i) => {
        if (i.id !== ideaId) return i;
        return {
          ...i,
          evaluations: i.evaluations.map((e) =>
            e.stageId === i.currentStageId ? { ...e, locked: true } : e,
          ),
          stageHistory: [
            ...i.stageHistory.map((v) =>
              v.stageId === i.currentStageId && !v.exitedAt
                ? { ...v, exitedAt: now, movedBy: currentUser.name }
                : v,
            ),
            { stageId: toStageId, enteredAt: now },
          ],
          currentStageId: toStageId,
        };
      }),
    );
    if (idea) {
      const funnel = funnelOfChallenge(idea.challengeId);
      const from = funnel.stages.find((s) => s.id === idea.currentStageId)?.name ?? "—";
      const to = funnel.stages.find((s) => s.id === toStageId)?.name ?? "—";
      ideaLog(
        idea,
        "Ideia avançou de etapa",
        `De "${from}" para "${to}" — avanço manual de ${currentUser.name}. Avaliações da etapa anterior ficaram travadas.`,
      );
    }
  };

  const decideIdea: Ctx["decideIdea"] = (ideaId, result, justification) => {
    const idea = ideas.find((i) => i.id === ideaId);
    const at = new Date().toISOString();
    const challenge = challenges.find((c) => c.id === idea?.challengeId);
    const minutes = [
      `ATA DE DECISÃO — ${formatDateTime(at)}`,
      `Desafio: ${challenge?.title ?? "—"}`,
      `Ideia: ${idea?.title ?? "—"}`,
      `Comitê presente: ${(challenge?.committeeIds ?? [])
        .map((id) => USERS.find((u) => u.id === id)?.name ?? id)
        .join(", ") || "não informado"}`,
      `Resultado: ${result === "aprovada" ? "Aprovada" : "Não aprovada"}`,
      `Justificativa: ${justification}`,
      `Registrado por: ${currentUser.name}`,
    ].join("\n");
    setIdeas((prev) =>
      prev.map((i) =>
        i.id === ideaId
          ? { ...i, decision: { result, justification, byId: viewer.id, at, minutes } }
          : i,
      ),
    );
    if (idea)
      ideaLog(
        idea,
        "Decisão final registrada",
        `${result === "aprovada" ? "Aprovada" : "Não aprovada"}. Ata gerada automaticamente.`,
      );
  };

  const setIdeaFeedback: Ctx["setIdeaFeedback"] = (ideaId, message, origin) => {
    const idea = ideas.find((i) => i.id === ideaId);
    setIdeas((prev) =>
      prev.map((i) => (i.id === ideaId ? { ...i, feedback: { message, origin, approved: false } } : i)),
    );
    if (idea)
      ideaLog(
        idea,
        "Feedback rascunhado",
        origin === "ia"
          ? "Rascunho gerado por IA simulada. Aguardando aprovação humana para envio."
          : "Rascunho escrito manualmente. Aguardando aprovação para envio.",
      );
  };

  const approveFeedback: Ctx["approveFeedback"] = (ideaId) => {
    const idea = ideas.find((i) => i.id === ideaId);
    setIdeas((prev) =>
      prev.map((i) =>
        i.id === ideaId && i.feedback
          ? {
              ...i,
              feedback: {
                ...i.feedback,
                approved: true,
                approvedBy: currentUser.name,
                approvedAt: new Date().toISOString(),
              },
            }
          : i,
      ),
    );
    if (idea)
      ideaLog(idea, "Feedback aprovado e enviado", `Aprovação manual de ${currentUser.name}.`);
  };

  const logsFor = (entityId: string) => logs.filter((l) => l.entityId === entityId);

  const visiblePrograms = (userId: string) =>
    programs.filter((p) => {
      if (p.audience.mode === "todos") return true;
      const user = users.find((u) => u.id === userId);
      if (p.audience.mode === "areas") return !!user && p.audience.areas.includes(user.area);
      return p.audience.userIds.includes(userId);
    });

  const updateUserCapabilities: Ctx["updateUserCapabilities"] = (userId, capabilities) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, capabilities } : u)));
  };

  const caps: Capabilities = {
    // participar nunca depende de capacidade
    participar: true,
    avaliar: has("avaliar_ideias"),
    gerenciar: has("acompanhar_desafios"),
    configurar: CONFIG_CAPABILITIES.some((c) => has(c)),
    gerenciarUsuarios: has("gerenciar_usuarios"),
    configurarProgramas: has("configurar_programas"),
    configurarDesafios: has("configurar_desafios"),
    configurarFunil: has("configurar_funil"),
    gerenciarObjetivos: has("gerenciar_objetivos"),
    excluirItens: has("excluir_itens"),
    decidirResultado: has("decidir_resultado"),
    aprovarComunicacao: has("aprovar_comunicacao"),
  };

  const value: Ctx = {
    viewAsId,
    setViewAs,
    caps,
    has,
    currentUser,

    areas: AREAS,
    users,
    updateUserCapabilities,
    programs,
    objectives,
    challenges,
    ideas,
    logs,
    addProgram,
    updateProgram,
    deleteProgram,
    addObjective,
    updateObjective,
    deleteObjective,
    objectiveInUse,
    addChallenge,
    updateChallenge,
    setChallengeStatus,
    deleteChallenge,
    addIdea,
    logsFor,
    visiblePrograms,
    funnelOfChallenge,
    updateFunnel,
    assignEvaluators,
    saveEvaluation,
    classifyIdea,
    advanceIdea,
    decideIdea,
    setIdeaFeedback,
    approveFeedback,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp precisa estar dentro de AppProvider");
  return ctx;
}

export function statusLabel(s: ChallengeStatus) {
  return {
    rascunho: "Rascunho",
    aberto: "Aberto",
    pausado: "Pausado",
    encerrado: "Submissões encerradas",
  }[s];
}

export function formatMoney(v: number, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(v);
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function formatDate(d?: string) {
  if (!d) return "Sem prazo";
  return new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR");
}

export function isExpired(c: Challenge) {
  return c.kind === "pontual" && !!c.deadline && new Date(`${c.deadline}T23:59:59`) < new Date();
}
