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
  Challenge,
  ChallengeStatus,
  Idea,
  LogEntry,
  Objective,
  Program,
  Role,
} from "./types";

const uid = () => Math.random().toString(36).slice(2, 10);

export interface Capabilities {
  participar: boolean;
  avaliar: boolean;
  gerenciar: boolean;
  configurar: boolean;
}

interface Ctx {
  role: Role;
  viewAsId: string;
  setViewAs: (id: string) => void;
  caps: Capabilities;
  currentUser: { id: string; name: string };
  areas: string[];
  users: typeof USERS;
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
}

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [viewAsId, setViewAs] = useState("u1");
  const [programs, setPrograms] = useState<Program[]>(seedPrograms);
  const [objectives, setObjectives] = useState<Objective[]>(seedObjectives);
  const [challenges, setChallenges] = useState<Challenge[]>(seedChallenges);
  const [ideas, setIdeas] = useState<Idea[]>(seedIdeas);
  const [logs, setLogs] = useState<LogEntry[]>(seedLogs);

  const viewer = USERS.find((u) => u.id === viewAsId) ?? USERS[0]!;
  const role: Role = viewer.role;
  const currentUser = useMemo(() => ({ id: viewer.id, name: viewer.name }), [viewer.id, viewer.name]);


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

  const logsFor = (entityId: string) => logs.filter((l) => l.entityId === entityId);

  const visiblePrograms = (userId: string) =>
    programs.filter((p) => {
      if (p.audience.mode === "todos") return true;
      const user = USERS.find((u) => u.id === userId);
      if (p.audience.mode === "areas") return !!user && p.audience.areas.includes(user.area);
      return p.audience.userIds.includes(userId);
    });

  const caps: Capabilities = {
    participar: visiblePrograms(viewer.id).length > 0,
    avaliar: challenges.some(
      (c) => c.evaluatorPoolIds.includes(viewer.id) || c.committeeIds.includes(viewer.id),
    ),
    gerenciar: role === "admin" || role === "gestor" || challenges.some((c) => c.ownerId === viewer.id),
    configurar: role === "admin",
  };

  const value: Ctx = {
    role,
    viewAsId,
    setViewAs,
    caps,
    currentUser,

    areas: AREAS,
    users: USERS,
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
