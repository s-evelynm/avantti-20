import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { consolidationLabel, mechanismLabel, stageConfigOf } from "@/lib/evaluation";
import type { Consolidation, Criterion } from "@/lib/types";

const uid = () => Math.random().toString(36).slice(2, 8);

export function EvaluationSetup({ challengeId }: { challengeId: string }) {
  const { challenges, users, funnelOfChallenge, updateChallenge } = useApp();
  const challenge = challenges.find((c) => c.id === challengeId)!;
  const funnel = funnelOfChallenge(challengeId);

  if (funnel.stages.length === 0)
    return (
      <p className="rounded-xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
        O programa deste desafio ainda não tem funil de avaliação. Monte o funil na configuração do
        programa para liberar critérios e regras por etapa.
      </p>
    );

  const patchCriteria = (criteria: Criterion[], what: string) => {
    updateChallenge(challenge.id, { criteria }, what);
    toast.success("Critérios atualizados");
  };

  const patchConfig = (stageId: string, patch: Partial<ReturnType<typeof stageConfigOf>>, what: string) => {
    updateChallenge(
      challenge.id,
      {
        stageConfigs: {
          ...challenge.stageConfigs,
          [stageId]: { ...stageConfigOf(challenge, stageId), ...patch },
        },
      },
      what,
    );
    toast.success("Configuração da etapa atualizada");
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="font-semibold">Papéis do desafio</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-card p-4">
            <p className="label-caps">Pool de avaliadores elegíveis</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Quem PODE ser escalado. A distribuição por ideia acontece no acompanhamento do funil.
            </p>
            <div className="mt-4 space-y-2">
              {users.map((u) => (
                <label key={u.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={challenge.evaluatorPoolIds.includes(u.id)}
                    onCheckedChange={(v) =>
                      updateChallenge(
                        challenge.id,
                        {
                          evaluatorPoolIds: v
                            ? [...challenge.evaluatorPoolIds, u.id]
                            : challenge.evaluatorPoolIds.filter((x) => x !== u.id),
                        },
                        `Pool de avaliadores alterado (${u.name}).`,
                      )
                    }
                  />
                  {u.name} <span className="text-xs text-muted-foreground">· {u.area}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <p className="label-caps">Comitê de decisão</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Delibera nas etapas de classificação e registra a decisão final com ata.
            </p>
            <div className="mt-4 space-y-2">
              {users.map((u) => (
                <label key={u.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={challenge.committeeIds.includes(u.id)}
                    onCheckedChange={(v) =>
                      updateChallenge(
                        challenge.id,
                        {
                          committeeIds: v
                            ? [...challenge.committeeIds, u.id]
                            : challenge.committeeIds.filter((x) => x !== u.id),
                        },
                        `Comitê de decisão alterado (${u.name}).`,
                      )
                    }
                  />
                  {u.name} <span className="text-xs text-muted-foreground">· {u.area}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold">Configuração por etapa</h3>
        {funnel.stages.map((stage) => {
          const cfg = stageConfigOf(challenge, stage.id);
          const criteria = challenge.criteria.filter((c) => c.stageId === stage.id);
          const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);
          return (
            <div key={stage.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{stage.name}</p>
                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs text-primary">
                  {mechanismLabel[stage.mechanism]}
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <Label className="label-caps">Regra de consolidação</Label>
                  <Select
                    value={cfg.consolidation}
                    onValueChange={(v) =>
                      patchConfig(
                        stage.id,
                        { consolidation: v as Consolidation },
                        `Consolidação da etapa "${stage.name}": ${consolidationLabel[v as Consolidation]}.`,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(consolidationLabel) as Consolidation[]).map((k) => (
                        <SelectItem key={k} value={k}>
                          {consolidationLabel[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="label-caps">Avaliadores necessários</Label>
                  <Input
                    type="number"
                    min={1}
                    defaultValue={cfg.evaluatorsNeeded}
                    onBlur={(e) =>
                      patchConfig(
                        stage.id,
                        { evaluatorsNeeded: Number(e.target.value) || 1 },
                        `Etapa "${stage.name}" passa a exigir ${e.target.value} avaliador(es).`,
                      )
                    }
                  />
                </div>
                <div>
                  <Label className="label-caps">Veículo de avaliação</Label>
                  <Input
                    defaultValue={cfg.vehicle}
                    placeholder="Ex: formulário online, reunião"
                    onBlur={(e) =>
                      e.target.value !== cfg.vehicle &&
                      patchConfig(stage.id, { vehicle: e.target.value }, `Veículo da etapa "${stage.name}" atualizado.`)
                    }
                  />
                </div>
              </div>

              {stage.mechanism === "nota" && (
                <div className="mt-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="label-caps">
                      Critérios desta etapa · soma dos pesos {totalWeight}%
                      {totalWeight !== 100 && criteria.length > 0 && (
                        <span className="ml-2 text-danger">(recomendado somar 100%)</span>
                      )}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        patchCriteria(
                          [
                            ...challenge.criteria,
                            { id: uid(), stageId: stage.id, name: "Novo critério", weight: 0, scaleMax: 10 },
                          ],
                          `Critério adicionado à etapa "${stage.name}".`,
                        )
                      }
                    >
                      Adicionar critério
                    </Button>
                  </div>

                  <ul className="mt-4 space-y-3">
                    {criteria.map((c) => (
                      <li key={c.id} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
                        <div>
                          <Label className="label-caps">Nome</Label>
                          <Input
                            defaultValue={c.name}
                            onBlur={(e) =>
                              e.target.value !== c.name &&
                              patchCriteria(
                                challenge.criteria.map((x) =>
                                  x.id === c.id ? { ...x, name: e.target.value } : x,
                                ),
                                `Critério renomeado para "${e.target.value}".`,
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label className="label-caps">Peso (%)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            defaultValue={c.weight}
                            onBlur={(e) =>
                              patchCriteria(
                                challenge.criteria.map((x) =>
                                  x.id === c.id ? { ...x, weight: Number(e.target.value) || 0 } : x,
                                ),
                                `Peso do critério "${c.name}" alterado para ${e.target.value}%.`,
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label className="label-caps">Escala (0 até)</Label>
                          <Input
                            type="number"
                            min={1}
                            defaultValue={c.scaleMax}
                            onBlur={(e) =>
                              patchCriteria(
                                challenge.criteria.map((x) =>
                                  x.id === c.id ? { ...x, scaleMax: Number(e.target.value) || 10 } : x,
                                ),
                                `Escala do critério "${c.name}" alterada para 0 a ${e.target.value}.`,
                              )
                            }
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              patchCriteria(
                                challenge.criteria.filter((x) => x.id !== c.id),
                                `Critério "${c.name}" removido.`,
                              )
                            }
                          >
                            Remover
                          </Button>
                        </div>
                      </li>
                    ))}
                    {criteria.length === 0 && (
                      <li className="text-sm text-muted-foreground">
                        Nenhum critério cadastrado para esta etapa de nota.
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {stage.mechanism === "classificacao" && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Opções de classificação desta etapa:{" "}
                  {stage.classificationOptions.join(", ") || "nenhuma cadastrada no funil do programa"}.
                </p>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
