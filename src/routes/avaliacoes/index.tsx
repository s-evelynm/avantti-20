import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp, formatDateTime } from "@/lib/store";
import { consolidate, criteriaOf, formatScore, mechanismLabel } from "@/lib/evaluation";

export const Route = createFileRoute("/avaliacoes/")({
  head: () => ({
    meta: [
      { title: "Minhas avaliações — Avantti" },
      {
        name: "description",
        content: "Ideias distribuídas para você avaliar, separadas entre pendentes e concluídas.",
      },
      { property: "og:title", content: "Minhas avaliações — Avantti" },
      { property: "og:description", content: "Fila de avaliação das ideias distribuídas a você." },
    ],
  }),
  component: AvaliacoesPage,
});

type Periodo = "todos" | "hoje" | "semana" | "antigas";

function bucketOf(iso: string): Exclude<Periodo, "todos"> {
  const diff = Date.now() - new Date(iso).getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return "hoje";
  if (diff < 7 * day) return "semana";
  return "antigas";
}

const bucketLabel: Record<Exclude<Periodo, "todos">, string> = {
  hoje: "Hoje",
  semana: "Esta semana",
  antigas: "Mais antigas",
};

function AvaliacoesPage() {
  const { challenges, ideas, currentUser, funnelOfChallenge } = useApp();
  const [filtroDesafio, setFiltroDesafio] = useState("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState<Periodo>("todos");

  const distribuidas = useMemo(
    () =>
      ideas
        .map((idea) => {
          const challenge = challenges.find((c) => c.id === idea.challengeId);
          if (!challenge || !idea.currentStageId) return null;
          const stage = funnelOfChallenge(idea.challengeId).stages.find(
            (s) => s.id === idea.currentStageId,
          );
          if (!stage) return null;
          const assigned = (idea.assignments[stage.id] ?? []).includes(currentUser.id);
          if (!assigned) return null;
          const minha = idea.evaluations.find(
            (e) => e.stageId === stage.id && e.evaluatorId === currentUser.id,
          );
          return { idea, challenge, stage, minha };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    [ideas, challenges, currentUser.id, funnelOfChallenge],
  );

  const pendentes = distribuidas.filter((d) => !d.minha);
  const concluidas = distribuidas
    .filter((d) => d.minha)
    .filter((d) => filtroDesafio === "todos" || d.challenge.id === filtroDesafio)
    .filter((d) => filtroPeriodo === "todos" || bucketOf(d.minha!.updatedAt ?? d.minha!.createdAt) === filtroPeriodo);

  const desafiosComAvaliacao = Array.from(
    new Map(distribuidas.filter((d) => d.minha).map((d) => [d.challenge.id, d.challenge])).values(),
  );

  return (
    <div>
      <PageHeader
        title="Minhas avaliações"
        description="Ideias distribuídas a você, a partir do pool de avaliadores de cada desafio."
      />

      <Tabs defaultValue="pendentes">
        <TabsList>
          <TabsTrigger value="pendentes">Pendentes ({pendentes.length})</TabsTrigger>
          <TabsTrigger value="concluidas">
            Concluídas ({distribuidas.filter((d) => d.minha).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="mt-6 space-y-2">
          {pendentes.map(({ idea, challenge, stage }) => (
            <div
              key={idea.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-l-[3px] border-l-primary bg-card p-4"
            >
              <div>
                <p className="text-sm font-medium">{idea.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {challenge.title} · etapa {stage.name} · {mechanismLabel[stage.mechanism]}
                </p>
              </div>
              <Button asChild size="sm">
                <Link to="/avaliacoes/$ideaId" params={{ ideaId: idea.id }}>
                  Avaliar
                </Link>
              </Button>
            </div>
          ))}
          {pendentes.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma avaliação pendente para você.</p>
          )}
        </TabsContent>

        <TabsContent value="concluidas" className="mt-6 space-y-6">
          <div className="flex flex-wrap gap-4">
            <div className="w-64">
              <p className="label-caps mb-1">Filtrar por desafio</p>
              <Select value={filtroDesafio} onValueChange={setFiltroDesafio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os desafios</SelectItem>
                  {desafiosComAvaliacao.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-56">
              <p className="label-caps mb-1">Filtrar por período</p>
              <Select value={filtroPeriodo} onValueChange={(v) => setFiltroPeriodo(v as Periodo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os períodos</SelectItem>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Esta semana</SelectItem>
                  <SelectItem value="antigas">Mais antigas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(["hoje", "semana", "antigas"] as const).map((bucket) => {
            const grupo = concluidas.filter(
              (d) => bucketOf(d.minha!.updatedAt ?? d.minha!.createdAt) === bucket,
            );
            if (grupo.length === 0) return null;
            return (
              <section key={bucket}>
                <h2 className="mb-3 text-sm font-semibold">{bucketLabel[bucket]}</h2>
                <ul className="space-y-2">
                  {grupo.map(({ idea, challenge, stage, minha }) => {
                    const cons = consolidate(challenge, stage.id, [minha!]);
                    return (
                      <li
                        key={idea.id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4"
                      >
                        <div>
                          <p className="text-sm font-medium">{idea.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {challenge.title} · {stage.name} ·{" "}
                            {formatDateTime(minha!.updatedAt ?? minha!.createdAt)}
                            {minha!.edited ? " · editado" : ""}
                            {minha!.locked ? " · travada" : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold text-primary">
                            {criteriaOf(challenge, stage.id).length > 0
                              ? `${formatScore(cons.perEvaluator[0]?.score ?? null)} / 10`
                              : "—"}
                          </span>
                          <Button asChild variant="outline" size="sm">
                            <Link to="/avaliacoes/$ideaId" params={{ ideaId: idea.id }}>
                              {minha!.locked ? "Ver avaliação" : "Editar avaliação"}
                            </Link>
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}

          {concluidas.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma avaliação concluída com os filtros selecionados.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
