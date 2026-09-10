import { useState } from "react";
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
import { useApp } from "@/lib/store";
import { mechanismLabel } from "@/lib/evaluation";
import type { Funnel, FunnelStage, StageMechanism } from "@/lib/types";

const uid = () => Math.random().toString(36).slice(2, 8);

export function FunnelBuilder({ programId }: { programId: string }) {
  const { programs, users, updateFunnel } = useApp();
  const program = programs.find((p) => p.id === programId)!;
  const funnel = program.funnel;
  const [dragId, setDragId] = useState<string | null>(null);

  const commit = (next: Funnel, what: string) => {
    updateFunnel(programId, next, what);
    toast.success("Funil atualizado");
  };

  const patchStage = (id: string, patch: Partial<FunnelStage>, what: string) =>
    commit(
      { ...funnel, stages: funnel.stages.map((s) => (s.id === id ? { ...s, ...patch } : s)) },
      what,
    );

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= funnel.stages.length) return;
    const stages = [...funnel.stages];
    const [item] = stages.splice(index, 1);
    stages.splice(target, 0, item!);
    commit({ ...funnel, stages }, `Etapa "${item!.name}" reordenada para a posição ${target + 1}.`);
  };

  const dropOn = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const stages = [...funnel.stages];
    const from = stages.findIndex((s) => s.id === dragId);
    const to = stages.findIndex((s) => s.id === targetId);
    const [item] = stages.splice(from, 1);
    stages.splice(to, 0, item!);
    setDragId(null);
    commit({ ...funnel, stages }, `Etapa "${item!.name}" reordenada para a posição ${to + 1}.`);
  };

  const addStage = () => {
    const stage: FunnelStage = {
      id: uid(),
      name: `Nova etapa ${funnel.stages.length + 1}`,
      mechanism: "revisao",
      readiness: "",
      ownerId: users[0]!.id,
      defaultDays: 7,
      classificationOptions: [],
    };
    const last = funnel.stages[funnel.stages.length - 1];
    commit(
      {
        stages: [...funnel.stages, stage],
        transitions: last
          ? [...funnel.transitions, { id: uid(), fromId: last.id, toId: stage.id, condition: "" }]
          : funnel.transitions,
      },
      `Etapa "${stage.name}" adicionada ao funil.`,
    );
  };

  const removeStage = (stage: FunnelStage) =>
    commit(
      {
        stages: funnel.stages.filter((s) => s.id !== stage.id),
        transitions: funnel.transitions.filter((t) => t.fromId !== stage.id && t.toId !== stage.id),
      },
      `Etapa "${stage.name}" removida, junto com as transições ligadas a ela.`,
    );

  return (
    <div className="space-y-8">
      <div className="rounded-lg bg-primary-soft p-4 text-sm">
        O funil pertence ao programa: todos os desafios deste programa herdam a mesma sequência de
        etapas. Arraste os cartões (ou use as setas) para reordenar.
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Etapas ({funnel.stages.length})</h3>
          <Button size="sm" onClick={addStage}>
            Adicionar etapa
          </Button>
        </div>

        {funnel.stages.length === 0 && (
          <p className="rounded-xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
            Nenhuma etapa ainda. Adicione a primeira etapa do funil.
          </p>
        )}

        <ol className="space-y-3">
          {funnel.stages.map((s, index) => (
            <li
              key={s.id}
              draggable
              onDragStart={() => setDragId(s.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dropOn(s.id)}
              className={`rounded-xl border border-l-[3px] border-l-primary bg-card p-4 ${
                dragId === s.id ? "opacity-60" : ""
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  <span className="mr-2 cursor-grab text-muted-foreground" aria-hidden>
                    ⠿
                  </span>
                  Etapa {index + 1}
                </p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => move(index, -1)} aria-label="Mover para cima">
                    ↑
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => move(index, 1)} aria-label="Mover para baixo">
                    ↓
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => removeStage(s)}>
                    Remover
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="label-caps">Nome da etapa</Label>
                  <Input
                    defaultValue={s.name}
                    onBlur={(e) =>
                      e.target.value !== s.name &&
                      patchStage(s.id, { name: e.target.value }, `Etapa renomeada para "${e.target.value}".`)
                    }
                  />
                </div>
                <div>
                  <Label className="label-caps">Mecanismo</Label>
                  <Select
                    value={s.mechanism}
                    onValueChange={(v) =>
                      patchStage(
                        s.id,
                        { mechanism: v as StageMechanism },
                        `Mecanismo da etapa "${s.name}" alterado para ${mechanismLabel[v as StageMechanism]}.`,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(mechanismLabel) as StageMechanism[]).map((m) => (
                        <SelectItem key={m} value={m}>
                          {mechanismLabel[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="label-caps">Responsável pelo avanço</Label>
                  <Select
                    value={s.ownerId}
                    onValueChange={(v) =>
                      patchStage(s.id, { ownerId: v }, `Responsável da etapa "${s.name}" alterado.`)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="label-caps">Prazo padrão (dias)</Label>
                  <Input
                    type="number"
                    min={1}
                    defaultValue={s.defaultDays}
                    onBlur={(e) =>
                      patchStage(
                        s.id,
                        { defaultDays: Number(e.target.value) || 1 },
                        `Prazo padrão da etapa "${s.name}" alterado para ${e.target.value} dia(s).`,
                      )
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="label-caps">Critério de avanço (sinal de prontidão)</Label>
                  <Input
                    defaultValue={s.readiness}
                    placeholder="Ex: 3 de 3 avaliadores concluíram"
                    onBlur={(e) =>
                      e.target.value !== s.readiness &&
                      patchStage(s.id, { readiness: e.target.value }, `Critério de avanço da etapa "${s.name}" atualizado.`)
                    }
                  />
                </div>
                {s.mechanism === "classificacao" && (
                  <div className="sm:col-span-2">
                    <Label className="label-caps">Opções de classificação (separadas por vírgula)</Label>
                    <Input
                      defaultValue={s.classificationOptions.join(", ")}
                      placeholder="Ex: Quick win, Projeto"
                      onBlur={(e) =>
                        patchStage(
                          s.id,
                          {
                            classificationOptions: e.target.value
                              .split(",")
                              .map((x) => x.trim())
                              .filter(Boolean),
                          },
                          `Opções de classificação da etapa "${s.name}" atualizadas.`,
                        )
                      }
                    />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Transições ({funnel.transitions.length})</h3>
          <Button
            variant="outline"
            size="sm"
            disabled={funnel.stages.length < 2}
            onClick={() =>
              commit(
                {
                  ...funnel,
                  transitions: [
                    ...funnel.transitions,
                    {
                      id: uid(),
                      fromId: funnel.stages[0]!.id,
                      toId: funnel.stages[1]!.id,
                      condition: "",
                    },
                  ],
                },
                "Nova transição criada entre etapas.",
              )
            }
          >
            Adicionar transição
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          A condição é opcional. Use aspas com a opção de classificação para tornar a etapa
          condicional — ex: Classificação = &quot;Projeto&quot;.
        </p>

        <ul className="space-y-3">
          {funnel.transitions.map((t) => (
            <li key={t.id} className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_1fr_2fr_auto]">
              <div>
                <Label className="label-caps">De</Label>
                <Select
                  value={t.fromId}
                  onValueChange={(v) =>
                    commit(
                      {
                        ...funnel,
                        transitions: funnel.transitions.map((x) =>
                          x.id === t.id ? { ...x, fromId: v } : x,
                        ),
                      },
                      "Origem de uma transição alterada.",
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {funnel.stages.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="label-caps">Para</Label>
                <Select
                  value={t.toId}
                  onValueChange={(v) =>
                    commit(
                      {
                        ...funnel,
                        transitions: funnel.transitions.map((x) =>
                          x.id === t.id ? { ...x, toId: v } : x,
                        ),
                      },
                      "Destino de uma transição alterado.",
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {funnel.stages.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="label-caps">Condição (opcional)</Label>
                <Input
                  defaultValue={t.condition}
                  placeholder='Ex: Classificação = "Projeto"'
                  onBlur={(e) =>
                    e.target.value !== t.condition &&
                    commit(
                      {
                        ...funnel,
                        transitions: funnel.transitions.map((x) =>
                          x.id === t.id ? { ...x, condition: e.target.value } : x,
                        ),
                      },
                      "Condição de uma transição atualizada.",
                    )
                  }
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    commit(
                      { ...funnel, transitions: funnel.transitions.filter((x) => x.id !== t.id) },
                      "Transição removida.",
                    )
                  }
                >
                  Remover
                </Button>
              </div>
            </li>
          ))}
          {funnel.transitions.length === 0 && (
            <li className="text-sm text-muted-foreground">Nenhuma transição configurada.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
