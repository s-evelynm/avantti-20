import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowDownUp,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDot,
  GitBranch,
  GripVertical,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mechanismLabel } from "@/lib/evaluation";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Funnel, FunnelStage, StageMechanism } from "@/lib/types";

const uid = () => Math.random().toString(36).slice(2, 8);

const mechanismTone: Record<StageMechanism, string> = {
  nota: "bg-info-bg text-info",
  classificacao: "bg-primary-soft text-primary",
  gate: "bg-success-bg text-success",
  revisao: "bg-warning-bg text-warning",
};

export function FunnelBuilder({ programId }: { programId: string }) {
  const { programs, users, updateFunnel } = useApp();
  const program = programs.find((item) => item.id === programId);
  const funnel = program?.funnel;
  const [selectedId, setSelectedId] = useState<string | null>(funnel?.stages[0]?.id ?? null);
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    if (!funnel?.stages.some((stage) => stage.id === selectedId)) {
      setSelectedId(funnel?.stages[0]?.id ?? null);
    }
  }, [funnel?.stages, selectedId]);

  const selected = useMemo(
    () => funnel?.stages.find((stage) => stage.id === selectedId) ?? null,
    [funnel?.stages, selectedId],
  );

  if (!program || !funnel) return null;

  const commit = (next: Funnel, what: string) => {
    updateFunnel(programId, next, what);
    toast.success("Funil atualizado");
  };

  const patchStage = (id: string, patch: Partial<FunnelStage>, what: string) =>
    commit(
      { ...funnel, stages: funnel.stages.map((stage) => (stage.id === id ? { ...stage, ...patch } : stage)) },
      what,
    );

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= funnel.stages.length) return;
    const stages = [...funnel.stages];
    const removed = stages.splice(index, 1)[0];
    if (!removed) return;
    stages.splice(target, 0, removed);
    commit({ ...funnel, stages }, `Etapa "${removed.name}" reordenada para a posição ${target + 1}.`);
  };

  const dropOn = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const stages = [...funnel.stages];
    const from = stages.findIndex((stage) => stage.id === dragId);
    const to = stages.findIndex((stage) => stage.id === targetId);
    if (from < 0 || to < 0) return;
    const removed = stages.splice(from, 1)[0];
    if (!removed) return;
    stages.splice(to, 0, removed);
    setDragId(null);
    commit({ ...funnel, stages }, `Etapa "${removed.name}" reordenada para a posição ${to + 1}.`);
  };

  const addStage = () => {
    const firstUser = users[0];
    if (!firstUser) return;
    const stage: FunnelStage = {
      id: uid(),
      name: `Nova etapa ${funnel.stages.length + 1}`,
      mechanism: "revisao",
      readiness: "",
      ownerId: firstUser.id,
      defaultDays: 7,
      classificationOptions: [],
    };
    const last = funnel.stages.at(-1);
    commit(
      {
        stages: [...funnel.stages, stage],
        transitions: last
          ? [...funnel.transitions, { id: uid(), fromId: last.id, toId: stage.id, condition: "" }]
          : funnel.transitions,
      },
      `Etapa "${stage.name}" adicionada ao funil.`,
    );
    setSelectedId(stage.id);
  };

  const removeStage = (stage: FunnelStage) => {
    const remaining = funnel.stages.filter((item) => item.id !== stage.id);
    setSelectedId(remaining[0]?.id ?? null);
    commit(
      {
        stages: remaining,
        transitions: funnel.transitions.filter(
          (transition) => transition.fromId !== stage.id && transition.toId !== stage.id,
        ),
      },
      `Etapa "${stage.name}" removida, junto com as transições ligadas a ela.`,
    );
  };

  const addTransition = () => {
    if (!selected) return;
    const destination = funnel.stages.find((stage) => stage.id !== selected.id);
    if (!destination) return;
    commit(
      {
        ...funnel,
        transitions: [
          ...funnel.transitions,
          { id: uid(), fromId: selected.id, toId: destination.id, condition: "" },
        ],
      },
      `Nova transição criada a partir de "${selected.name}".`,
    );
  };

  const outgoing = selected
    ? funnel.transitions.filter((transition) => transition.fromId === selected.id)
    : [];

  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm" aria-label="Editor do funil de avaliação">
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-heading text-base font-semibold">Workflow do programa</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {funnel.stages.length} etapas · {funnel.transitions.length} conexões
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success-bg px-2.5 py-1 text-xs font-medium text-success">
            <CheckCircle2 className="size-3.5" /> Salvo
          </span>
        </div>
        <Button size="sm" onClick={addStage}>
          <Plus /> Nova etapa
        </Button>
      </header>

      <div className="grid min-h-[620px] lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
        <div className="workflow-canvas relative min-h-[520px] overflow-auto border-b p-6 lg:border-r lg:border-b-0 sm:p-10">
          <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center">
            {funnel.stages.map((stage, index) => {
              const transitions = funnel.transitions.filter((item) => item.fromId === stage.id);
              const isSelected = stage.id === selectedId;
              const owner = users.find((user) => user.id === stage.ownerId);

              return (
                <div key={stage.id} className="contents">
                  <article
                    draggable
                    onDragStart={() => setDragId(stage.id)}
                    onDragEnd={() => setDragId(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => dropOn(stage.id)}
                    onClick={() => setSelectedId(stage.id)}
                    className={cn(
                      "group relative w-full max-w-sm cursor-pointer rounded-lg border bg-card p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-within:ring-2 focus-within:ring-ring",
                      isSelected && "border-primary shadow-md ring-4 ring-primary-soft",
                      dragId === stage.id && "opacity-50",
                    )}
                  >
                    <button
                      type="button"
                      className="absolute inset-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Editar etapa ${stage.name}`}
                      onClick={() => setSelectedId(stage.id)}
                    />
                    <div className="relative flex items-start gap-3 pointer-events-none">
                      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                        <CircleDot className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-heading text-sm font-semibold text-foreground">{stage.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Etapa {index + 1}</p>
                          </div>
                          <GripVertical className="size-4 shrink-0 text-muted-foreground opacity-50" />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className={cn("rounded-full px-2 py-1 text-[11px] font-medium", mechanismTone[stage.mechanism])}>
                            {mechanismLabel[stage.mechanism]}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <CalendarDays className="size-3" /> {stage.defaultDays} dias
                          </span>
                          <span className="inline-flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
                            <UserRound className="size-3" /> <span className="truncate">{owner?.name ?? "Sem responsável"}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>

                  {index < funnel.stages.length - 1 && (
                    <div className="flex min-h-16 flex-col items-center justify-center py-2" aria-hidden="true">
                      <div className="h-5 w-px bg-border" />
                      {transitions.length > 1 ? (
                        <div className="flex max-w-lg flex-wrap justify-center gap-1.5 rounded-full border bg-card px-2 py-1 shadow-sm">
                          <GitBranch className="size-3.5 text-primary" />
                          {transitions.map((transition) => (
                            <span key={transition.id} className="max-w-40 truncate text-[10px] text-muted-foreground">
                              {transition.condition || "Sempre"} → {funnel.stages.find((item) => item.id === transition.toId)?.name}
                            </span>
                          ))}
                        </div>
                      ) : transitions[0]?.condition ? (
                        <span className="max-w-xs truncate rounded-full border bg-card px-2 py-1 text-[10px] text-muted-foreground shadow-sm">
                          {transitions[0].condition}
                        </span>
                      ) : null}
                      <ArrowDown className="size-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            })}

            {funnel.stages.length === 0 && (
              <button
                type="button"
                onClick={addStage}
                className="flex min-h-40 w-full max-w-sm flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed bg-card/70 text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Plus className="size-6" />
                <span className="text-sm font-medium">Adicionar a primeira etapa</span>
              </button>
            )}
          </div>
        </div>

        <aside className="flex min-h-0 flex-col bg-card" aria-label="Propriedades da etapa">
          {selected ? (
            <>
              <div className="border-b px-5 py-4 sm:px-6">
                <p className="label-caps">Propriedades da etapa</p>
                <h3 className="mt-1 font-heading text-base font-semibold">{selected.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">As alterações são salvas ao sair de cada campo.</p>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`stage-name-${selected.id}`}>Nome da etapa</Label>
                    <Input
                      id={`stage-name-${selected.id}`}
                      className="mt-1.5 bg-background"
                      key={`name-${selected.id}-${selected.name}`}
                      defaultValue={selected.name}
                      onBlur={(event) => {
                        const value = event.target.value.trim();
                        if (value && value !== selected.name) {
                          patchStage(selected.id, { name: value }, `Etapa renomeada para "${value}".`);
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label>Mecanismo</Label>
                    <Select
                      value={selected.mechanism}
                      onValueChange={(value) =>
                        patchStage(
                          selected.id,
                          { mechanism: value as StageMechanism },
                          `Mecanismo da etapa "${selected.name}" alterado para ${mechanismLabel[value as StageMechanism]}.`,
                        )
                      }
                    >
                      <SelectTrigger className="mt-1.5 bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(mechanismLabel) as StageMechanism[]).map((mechanism) => (
                          <SelectItem key={mechanism} value={mechanism}>{mechanismLabel[mechanism]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <div>
                      <Label>Responsável pelo avanço</Label>
                      <Select
                        value={selected.ownerId}
                        onValueChange={(value) => patchStage(selected.id, { ownerId: value }, `Responsável da etapa "${selected.name}" alterado.`)}
                      >
                        <SelectTrigger className="mt-1.5 bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {users.map((user) => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`days-${selected.id}`}>Prazo padrão</Label>
                      <div className="relative mt-1.5">
                        <Input
                          id={`days-${selected.id}`}
                          className="bg-background pr-12"
                          type="number"
                          min={1}
                          key={`days-${selected.id}-${selected.defaultDays}`}
                          defaultValue={selected.defaultDays}
                          onBlur={(event) => {
                            const days = Number(event.target.value) || 1;
                            if (days !== selected.defaultDays) patchStage(selected.id, { defaultDays: days }, `Prazo padrão da etapa "${selected.name}" alterado para ${days} dia(s).`);
                          }}
                        />
                        <span className="pointer-events-none absolute top-2 right-3 text-xs text-muted-foreground">dias</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`readiness-${selected.id}`}>Sinal de prontidão</Label>
                    <Input
                      id={`readiness-${selected.id}`}
                      className="mt-1.5 bg-background"
                      key={`ready-${selected.id}-${selected.readiness}`}
                      defaultValue={selected.readiness}
                      placeholder="Ex: 3 de 3 avaliadores concluíram"
                      onBlur={(event) => {
                        if (event.target.value !== selected.readiness) patchStage(selected.id, { readiness: event.target.value }, `Critério de avanço da etapa "${selected.name}" atualizado.`);
                      }}
                    />
                  </div>
                  {selected.mechanism === "classificacao" && (
                    <div>
                      <Label htmlFor={`options-${selected.id}`}>Opções de classificação</Label>
                      <Input
                        id={`options-${selected.id}`}
                        className="mt-1.5 bg-background"
                        key={`options-${selected.id}-${selected.classificationOptions.join("-")}`}
                        defaultValue={selected.classificationOptions.join(", ")}
                        placeholder="Quick win, Projeto"
                        onBlur={(event) => patchStage(selected.id, { classificationOptions: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }, `Opções de classificação da etapa "${selected.name}" atualizadas.`)}
                      />
                    </div>
                  )}
                </div>

                <section className="border-t pt-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-heading text-sm font-semibold">Transições de saída</h4>
                      <p className="mt-0.5 text-xs text-muted-foreground">Defina os próximos caminhos desta etapa.</p>
                    </div>
                    <Button variant="outline" size="sm" disabled={funnel.stages.length < 2} onClick={addTransition} aria-label="Adicionar transição">
                      <Plus /> Adicionar
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {outgoing.map((transition) => (
                      <div key={transition.id} className="rounded-md border bg-background p-3">
                        <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <GitBranch className="size-3.5 text-primary" />
                          {selected.name} <ArrowDown className="size-3" />
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs">Destino</Label>
                            <Select
                              value={transition.toId}
                              onValueChange={(value) => commit({ ...funnel, transitions: funnel.transitions.map((item) => item.id === transition.id ? { ...item, toId: value } : item) }, "Destino de uma transição alterado.")}
                            >
                              <SelectTrigger className="mt-1 bg-card"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {funnel.stages.filter((stage) => stage.id !== selected.id).map((stage) => <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor={`condition-${transition.id}`} className="text-xs">Condição opcional</Label>
                            <Input
                              id={`condition-${transition.id}`}
                              className="mt-1 bg-card"
                              key={`${transition.id}-${transition.condition}`}
                              defaultValue={transition.condition}
                              placeholder='Classificação = "Projeto"'
                              onBlur={(event) => {
                                if (event.target.value !== transition.condition) commit({ ...funnel, transitions: funnel.transitions.map((item) => item.id === transition.id ? { ...item, condition: event.target.value } : item) }, "Condição de uma transição atualizada.");
                              }}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger hover:bg-danger-bg hover:text-danger"
                            onClick={() => commit({ ...funnel, transitions: funnel.transitions.filter((item) => item.id !== transition.id) }, "Transição removida.")}
                          >
                            <Trash2 /> Remover conexão
                          </Button>
                        </div>
                      </div>
                    ))}
                    {outgoing.length === 0 && <p className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">Esta etapa ainda não possui saída.</p>}
                  </div>
                </section>
              </div>

              <footer className="flex items-center justify-between gap-3 border-t bg-background/60 px-5 py-4 sm:px-6">
                <Button variant="ghost" size="sm" className="text-danger hover:bg-danger-bg hover:text-danger" onClick={() => removeStage(selected)}>
                  <Trash2 /> Remover etapa
                </Button>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" disabled={funnel.stages.findIndex((stage) => stage.id === selected.id) === 0} onClick={() => move(funnel.stages.findIndex((stage) => stage.id === selected.id), -1)} aria-label="Mover etapa para cima" title="Mover para cima">
                    <ChevronUp />
                  </Button>
                  <Button variant="outline" size="icon" disabled={funnel.stages.findIndex((stage) => stage.id === selected.id) === funnel.stages.length - 1} onClick={() => move(funnel.stages.findIndex((stage) => stage.id === selected.id), 1)} aria-label="Mover etapa para baixo" title="Mover para baixo">
                    <ChevronDown />
                  </Button>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <ArrowDownUp className="mb-3 size-7" />
              <p className="text-sm font-medium">Selecione uma etapa para editar</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}