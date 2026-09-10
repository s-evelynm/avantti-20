import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Breadcrumbs,
  CrumbSeparator,
  CurrentCrumb,
  PageHeader,
  crumbLinkClass,
} from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useApp, formatDateTime } from "@/lib/store";
import {
  consolidationLabel,
  criteriaOf,
  formatScore,
  mechanismLabel,
  stageConfigOf,
} from "@/lib/evaluation";

export const Route = createFileRoute("/avaliacoes/$ideaId")({
  head: () => ({
    meta: [
      { title: "Avaliar ideia — Avantti" },
      {
        name: "description",
        content: "Formulário de avaliação da ideia: notas por critério, comentário e nota consolidada ao vivo.",
      },
      { property: "og:title", content: "Avaliar ideia — Avantti" },
      { property: "og:description", content: "Notas por critério e comentário obrigatório do avaliador." },
    ],
  }),
  component: AvaliarIdeia,
});

function AvaliarIdeia() {
  const { ideaId } = Route.useParams();
  const navigate = useNavigate();
  const { ideas, challenges, users, currentUser, funnelOfChallenge, saveEvaluation } = useApp();
  const idea = ideas.find((i) => i.id === ideaId);
  const challenge = challenges.find((c) => c.id === idea?.challengeId);
  const stage = idea && challenge
    ? funnelOfChallenge(challenge.id).stages.find((s) => s.id === idea.currentStageId)
    : undefined;

  const existing = idea?.evaluations.find(
    (e) => e.stageId === stage?.id && e.evaluatorId === currentUser.id,
  );
  const criteria = challenge && stage ? criteriaOf(challenge, stage.id) : [];
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const base: Record<string, number> = {};
    criteria.forEach((c) => {
      base[c.id] = existing?.scores[c.id] ?? Math.round(c.scaleMax / 2);
    });
    return base;
  });
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [error, setError] = useState("");

  if (!idea || !challenge || !stage)
    return (
      <div>
        <p className="text-muted-foreground">Avaliação não encontrada.</p>
        <Link to="/avaliacoes" className="text-primary underline">
          Voltar para minhas avaliações
        </Link>
      </div>
    );

  const cfg = stageConfigOf(challenge, stage.id);
  const locked = !!existing?.locked;
  const author = users.find((u) => u.id === idea.authorId)?.name ?? "Anônimo";

  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0) || 1;
  const liveScore =
    criteria.length === 0
      ? null
      : cfg.consolidation === "ponderada"
        ? criteria.reduce(
            (s, c) => s + ((scores[c.id] ?? 0) / c.scaleMax) * 10 * c.weight,
            0,
          ) / totalWeight
        : criteria.reduce((s, c) => s + ((scores[c.id] ?? 0) / c.scaleMax) * 10, 0) / criteria.length;

  return (
    <div>
      <Breadcrumbs>
        <Link to="/avaliacoes" className={crumbLinkClass}>
          Minhas avaliações
        </Link>
        <CrumbSeparator />
        <CurrentCrumb label={idea.title} />
      </Breadcrumbs>

      <PageHeader
        title={idea.title}
        description={`${challenge.title} · etapa ${stage.name} · ${mechanismLabel[stage.mechanism]}`}
      />

      {locked && (
        <div className="mb-4 rounded-lg bg-warning-bg p-4 text-sm text-warning">
          A ideia já avançou de etapa: sua avaliação ficou travada e agora é somente leitura.
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-4">
          <div className="rounded-xl border bg-card p-4">
            <p className="label-caps">Autor</p>
            <p className="mt-1 text-sm">
              {author} · enviada em {formatDateTime(idea.createdAt)}
            </p>
            <p className="label-caps mt-4">Descrição</p>
            <p className="mt-1 text-sm">{idea.description}</p>
            {idea.link && <p className="mt-2 text-sm text-primary">{idea.link}</p>}
            {idea.attachments.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Anexos: {idea.attachments.join(", ")}
              </p>
            )}
          </div>

          <Collapsible defaultOpen>
            <CollapsibleTrigger className="w-full rounded-lg border bg-card p-3 text-left text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
              Respostas do formulário ({idea.formSnapshot.length})
            </CollapsibleTrigger>
            <CollapsibleContent>
              <dl className="mt-2 space-y-3 rounded-xl border bg-card p-4 text-sm">
                {idea.formSnapshot.map((f) => (
                  <div key={f.id}>
                    <dt className="label-caps">{f.label}</dt>
                    <dd>
                      {Array.isArray(idea.answers[f.id])
                        ? (idea.answers[f.id] as string[]).join(", ")
                        : ((idea.answers[f.id] as string) ?? "—")}
                    </dd>
                  </div>
                ))}
                {idea.formSnapshot.length === 0 && (
                  <p className="text-muted-foreground">Sem perguntas específicas.</p>
                )}
              </dl>
            </CollapsibleContent>
          </Collapsible>
        </section>

        <section className="space-y-4">
          <div className="rounded-xl border bg-card p-4">
            <p className="label-caps">Nota consolidada ao vivo</p>
            <p className="mt-2 text-3xl font-semibold text-primary">
              {formatScore(liveScore)} <span className="text-sm font-normal">/ 10</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {consolidationLabel[cfg.consolidation]} · veículo: {cfg.vehicle || "não informado"}
            </p>
          </div>

          {criteria.map((c) => (
            <div key={c.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <Label className="label-caps">
                  {c.name} · peso {c.weight}%
                </Label>
                <span className="text-sm font-semibold">
                  {scores[c.id] ?? 0} / {c.scaleMax}
                </span>
              </div>
              <Slider
                className="mt-4"
                disabled={locked}
                min={0}
                max={c.scaleMax}
                step={1}
                value={[scores[c.id] ?? 0]}
                onValueChange={(v) => setScores((prev) => ({ ...prev, [c.id]: v[0] ?? 0 }))}
              />
            </div>
          ))}

          {criteria.length === 0 && (
            <p className="rounded-xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
              Esta etapa não tem critérios de nota cadastrados. Registre apenas o comentário.
            </p>
          )}

          <div className="rounded-xl border bg-card p-4">
            <Label className="label-caps">Comentário (obrigatório)</Label>
            <Textarea
              className={`mt-2 ${error ? "border-danger" : ""}`}
              rows={5}
              disabled={locked}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setError("");
              }}
            />
            {error && <p className="mt-2 text-sm text-danger">{error}</p>}
          </div>

          {existing && (
            <p className="text-xs text-muted-foreground">
              Registrada em {formatDateTime(existing.createdAt)}
              {existing.edited ? ` · editada em ${formatDateTime(existing.updatedAt ?? existing.createdAt)}` : ""}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              disabled={locked}
              onClick={() => {
                if (!comment.trim()) {
                  setError("O comentário é obrigatório para concluir a avaliação.");
                  return;
                }
                saveEvaluation(idea.id, stage.id, scores, comment.trim());
                toast.success("Avaliação salva");
                navigate({ to: "/avaliacoes" });
              }}
            >
              {existing ? "Salvar alterações" : "Concluir avaliação"}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/avaliacoes">Voltar</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
