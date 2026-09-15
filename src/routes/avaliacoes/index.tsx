import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
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
import { useApp } from "@/lib/store";
import { consolidate, criteriaOf, daysLeftInStage, formatScore } from "@/lib/evaluation";

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

function prazoLabel(days: number | null) {
  if (days === null) return "";
  if (days < 0) return `Atrasada há ${Math.abs(days)} ${Math.abs(days) === 1 ? "dia" : "dias"}`;
  if (days === 0) return "Vence hoje";
  return days === 1 ? "Falta 1 dia" : `Faltam ${days} dias`;
}

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
            (e) => e.stageId === stage.id && e.evaluatorId === currentUser.id && !e.draft,
          );
          return { idea, challenge, stage, minha };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    [ideas, challenges, currentUser.id, funnelOfChallenge],
  );

  const pendentes = distribuidas.filter((d) => !d.minha);
  const todasConcluidas = distribuidas.filter((d) => d.minha);
  const concluidas = todasConcluidas
    .filter((d) => filtroDesafio === "todos" || d.challenge.id === filtroDesafio)
    .filter(
      (d) =>
        filtroPeriodo === "todos" ||
        bucketOf(d.minha!.updatedAt ?? d.minha!.createdAt) === filtroPeriodo,
    );

  const desafiosComAvaliacao = Array.from(
    new Map(todasConcluidas.map((d) => [d.challenge.id, d.challenge])).values(),
  );

  return (
    <div>
      <PageHeader title="Minhas avaliações" description="Ideias distribuídas para você avaliar" />

      <Tabs defaultValue="pendentes">
        <TabsList>
          <TabsTrigger value="pendentes">
            Pendentes
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {pendentes.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="concluidas">Concluídas</TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="mt-6 space-y-3">
          {pendentes.map(({ idea, challenge, stage }) => {
            const dias = daysLeftInStage(idea, stage);
            const urgente = dias !== null && dias <= 1;
            return (
              <div
                key={idea.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm"
              >
                <div className="min-w-0">
                  <p className="text-base font-medium">{idea.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {challenge.title} · {stage.name}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-sm ${urgente ? "font-medium text-danger" : "text-muted-foreground"}`}
                  >
                    {prazoLabel(dias)}
                  </span>
                  <Button asChild size="sm">
                    <Link to="/avaliacoes/$ideaId" params={{ ideaId: idea.id }}>
                      Avaliar
                      <ArrowUpRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
          {pendentes.length === 0 && (
            <p className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
              Nada esperando você agora. Quando uma ideia for encaminhada para a sua avaliação, ela
              aparece nesta lista.
            </p>
          )}
        </TabsContent>

        <TabsContent value="concluidas" className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-base font-semibold">Concluídas</h2>
            <div className="flex flex-wrap gap-3">
              <Select value={filtroDesafio} onValueChange={setFiltroDesafio}>
                <SelectTrigger className="w-56">
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
              <Select value={filtroPeriodo} onValueChange={(v) => setFiltroPeriodo(v as Periodo)}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os períodos</SelectItem>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Últimos 7 dias</SelectItem>
                  <SelectItem value="antigas">Mais antigas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {concluidas.length} {concluidas.length === 1 ? "avaliação" : "avaliações"} no período
            selecionado,{" "}
            {filtroDesafio === "todos"
              ? "em todos os desafios"
              : `em ${desafiosComAvaliacao.find((c) => c.id === filtroDesafio)?.title ?? ""}`}
          </p>

          {(["hoje", "semana", "antigas"] as const).map((bucket) => {
            const grupo = concluidas.filter(
              (d) => bucketOf(d.minha!.updatedAt ?? d.minha!.createdAt) === bucket,
            );
            if (grupo.length === 0) return null;
            return (
              <section key={bucket}>
                <h3 className="label-caps mb-2">{bucketLabel[bucket]}</h3>
                <ul className="space-y-3">
                  {grupo.map(({ idea, challenge, stage, minha }) => {
                    const cons = consolidate(challenge, stage.id, [minha!]);
                    const temNota = criteriaOf(challenge, stage.id).length > 0;
                    return (
                      <li
                        key={idea.id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm"
                      >
                        <div className="min-w-0">
                          <p className="text-base font-medium">{idea.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{challenge.title}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium">
                            {temNota
                              ? `Nota ${formatScore(cons.perEvaluator[0]?.score ?? null)}`
                              : "Sem nota"}
                          </span>
                          <Button asChild variant="outline" size="sm">
                            <Link to="/avaliacoes/$ideaId" params={{ ideaId: idea.id }}>
                              Ver avaliação
                              <ArrowUpRight className="size-4" />
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
            <p className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
              Nenhuma avaliação concluída com esses filtros. Limpe os filtros para ver todas.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
