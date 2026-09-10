import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Breadcrumbs, CrumbSeparator, CurrentCrumb, crumbLinkClass } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useApp, formatDateTime } from "@/lib/store";
import { criteriaOf, formatScore, stageConfigOf } from "@/lib/evaluation";

export const Route = createFileRoute("/avaliacoes/$ideaId")({
  head: () => ({
    meta: [
      { title: "Avaliar ideia — Avantti" },
      {
        name: "description",
        content:
          "Formulário de avaliação da ideia: notas por critério, comentário e nota consolidada ao vivo.",
      },
      { property: "og:title", content: "Avaliar ideia — Avantti" },
      {
        property: "og:description",
        content: "Notas por critério e comentário obrigatório do avaliador.",
      },
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
  const stage =
    idea && challenge
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

  const outrosAvaliadores = (idea.assignments[stage.id] ?? [])
    .filter((id) => id !== currentUser.id)
    .map((id) => users.find((u) => u.id === id)?.name)
    .filter(Boolean)
    .join(", ");

  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0) || 1;
  const liveScore =
    criteria.length === 0
      ? null
      : cfg.consolidation === "ponderada"
        ? criteria.reduce((s, c) => s + ((scores[c.id] ?? 0) / c.scaleMax) * 10 * c.weight, 0) /
          totalWeight
        : criteria.reduce((s, c) => s + ((scores[c.id] ?? 0) / c.scaleMax) * 10, 0) /
          criteria.length;

  const answerText = (fieldId: string) => {
    const v = idea.answers[fieldId];
    if (Array.isArray(v)) return v.join(", ");
    return v?.trim() ? v : "—";
  };

  const submit = (draft: boolean) => {
    if (!draft && !comment.trim()) {
      setError("O comentário é obrigatório para enviar a avaliação.");
      return;
    }
    saveEvaluation(idea.id, stage.id, scores, comment.trim(), draft);
    toast.success(draft ? "Rascunho salvo" : "Avaliação enviada");
    if (!draft) navigate({ to: "/avaliacoes" });
  };

  return (
    <div className="max-w-5xl">
      <Breadcrumbs>
        <Link to="/avaliacoes" className={crumbLinkClass}>
          Minhas avaliações
        </Link>
        <CrumbSeparator />
        <CurrentCrumb label={challenge.title} />
      </Breadcrumbs>

      <header className="mt-2 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">{idea.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Etapa: {stage.name}
          {outrosAvaliadores && <> · {outrosAvaliadores}</>}
        </p>
      </header>

      {locked && (
        <div className="mb-6 rounded-lg bg-warning-bg p-4 text-sm text-warning">
          A ideia já avançou de etapa: sua avaliação ficou travada e agora é somente leitura.
        </div>
      )}

      <div className="grid gap-12 lg:grid-cols-2">
        <section>
          <h2 className="label-caps mb-4">Conteúdo da ideia</h2>

          <h3 className="text-sm font-semibold">Descrição</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{idea.description}</p>

          <dl className="mt-6 divide-y border-t text-sm">
            {idea.formSnapshot.map((f) => (
              <div key={f.id} className="flex justify-between gap-8 py-3">
                <dt className="text-muted-foreground">{f.label}</dt>
                <dd className="text-right font-medium">{answerText(f.id)}</dd>
              </div>
            ))}
            {idea.link && (
              <div className="flex justify-between gap-8 py-3">
                <dt className="text-muted-foreground">Link</dt>
                <dd className="text-right font-medium break-all">{idea.link}</dd>
              </div>
            )}
            {idea.attachments.length > 0 && (
              <div className="flex justify-between gap-8 py-3">
                <dt className="text-muted-foreground">Anexos</dt>
                <dd className="text-right font-medium">{idea.attachments.join(", ")}</dd>
              </div>
            )}
          </dl>
        </section>

        <section>
          <h2 className="label-caps mb-4">Sua avaliação</h2>

          <div className="space-y-6">
            {criteria.map((c) => (
              <div key={c.id}>
                <div className="flex items-baseline justify-between">
                  <Label className="text-sm font-medium">{c.name}</Label>
                  <span className="text-xs text-muted-foreground">{c.weight}%</span>
                </div>
                <Slider
                  className="mt-3"
                  disabled={locked}
                  min={0}
                  max={c.scaleMax}
                  step={1}
                  value={[scores[c.id] ?? 0]}
                  onValueChange={(v) => setScores((prev) => ({ ...prev, [c.id]: v[0] ?? 0 }))}
                />
                <p className="mt-1 text-right text-sm font-semibold">{scores[c.id] ?? 0}</p>
              </div>
            ))}
          </div>

          {criteria.length === 0 && (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Esta etapa não tem critérios de nota. Registre apenas o comentário.
            </p>
          )}

          {criteria.length > 0 && (
            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">
                {cfg.consolidation === "ponderada" ? "Nota ponderada" : "Nota média"}
              </span>
              <span className="text-2xl font-semibold">{formatScore(liveScore)}</span>
            </div>
          )}

          <div className="mt-6">
            <Label className="text-sm font-medium">Comentário</Label>
            <Textarea
              className={`mt-2 ${error ? "border-danger focus-visible:ring-danger" : ""}`}
              rows={4}
              disabled={locked}
              placeholder="O que reforça ou preocupa nessa ideia?"
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setError("");
              }}
            />
            {error && <p className="mt-2 text-sm text-danger">{error}</p>}
          </div>

          {existing && (
            <p className="mt-3 text-xs text-muted-foreground">
              {existing.draft ? "Rascunho salvo em " : "Registrada em "}
              {formatDateTime(existing.updatedAt ?? existing.createdAt)}
              {existing.edited ? " · editada" : ""}
            </p>
          )}

          <div className="mt-6 space-y-3">
            <Button className="w-full" disabled={locked} onClick={() => submit(false)}>
              {existing && !existing.draft ? "Salvar alterações" : "Enviar avaliação"}
            </Button>
            <Button
              className="w-full"
              variant="outline"
              disabled={locked}
              onClick={() => submit(true)}
            >
              Salvar rascunho
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
