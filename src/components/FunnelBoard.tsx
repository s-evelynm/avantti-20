import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp, formatDateTime } from "@/lib/store";
import {
  consolidate,
  consolidationLabel,
  criteriaOf,
  formatScore,
  isReady,
  mechanismLabel,
  nextStages,
  stageConfigOf,
} from "@/lib/evaluation";
import { aiFeedbackFromEvaluations } from "@/lib/ai-mock";
import { SuggestionTag } from "@/components/SuggestionTag";
import {
  duplicateOf,
  namesOf,
  suggestEvaluators,
  triageChecklist,
} from "@/lib/triage";
import type { Idea } from "@/lib/types";

export function FunnelBoard({ challengeId }: { challengeId: string }) {
  const { challenges, ideas, users, funnelOfChallenge } = useApp();
  const challenge = challenges.find((c) => c.id === challengeId)!;
  const funnel = funnelOfChallenge(challengeId);
  const challengeIdeas = ideas.filter((i) => i.challengeId === challengeId);
  const [openIdeaId, setOpenIdeaId] = useState<string | null>(null);
  const openIdea = challengeIdeas.find((i) => i.id === openIdeaId) ?? null;

  if (funnel.stages.length === 0)
    return (
      <p className="rounded-xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
        O programa deste desafio ainda não tem funil montado. Configure as etapas no programa para
        acompanhar as ideias aqui.
      </p>
    );

  return (
    <div>
      <div className="mb-4 rounded-lg bg-primary-soft p-4 text-sm">
        Nenhum card se move sozinho: mesmo com o sinal de prontidão atingido, o avanço é sempre uma
        ação manual de uma pessoa.
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {funnel.stages.map((stage) => {
          const cards = challengeIdeas.filter((i) => i.currentStageId === stage.id);
          const cfg = stageConfigOf(challenge, stage.id);
          return (
            <section key={stage.id} className="w-72 shrink-0 rounded-xl border bg-muted/40 p-3">
              <p className="text-sm font-semibold">{stage.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {mechanismLabel[stage.mechanism]} · {cfg.evaluatorsNeeded} avaliador(es) ·{" "}
                {stage.defaultDays} dia(s)
              </p>
              {stage.readiness && (
                <p className="mt-2 text-xs text-muted-foreground">Sinal: {stage.readiness}</p>
              )}

              <ul className="mt-3 space-y-2">
                {cards.map((idea) => {
                  const ready = isReady(challenge, stage, idea);
                  return (
                    <li key={idea.id}>
                      <button
                        onClick={() => setOpenIdeaId(idea.id)}
                        className="w-full rounded-lg border bg-card p-3 text-left transition-colors hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <p className="text-sm font-medium">{idea.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {users.find((u) => u.id === idea.authorId)?.name ?? "Anônimo"}
                        </p>
                        {ready && (
                          <span className="mt-2 inline-block rounded-full bg-success-bg px-2 py-1 text-xs text-success">
                            Pronto para avançar
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
                {cards.length === 0 && (
                  <li className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                    Sem ideias nesta etapa.
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>

      <Dialog open={!!openIdea} onOpenChange={(v) => !v && setOpenIdeaId(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          {openIdea && <IdeaPanel idea={openIdea} challengeId={challengeId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IdeaPanel({ idea, challengeId }: { idea: Idea; challengeId: string }) {
  const {
    challenges,
    ideas: allIdeas,
    users,
    currentUser,
    funnelOfChallenge,
    assignEvaluators,
    classifyIdea,
    advanceIdea,
    decideIdea,
    setIdeaFeedback,
    approveFeedback,
  } = useApp();
  const challenge = challenges.find((c) => c.id === challengeId)!;
  const funnel = funnelOfChallenge(challengeId);
  const stage = funnel.stages.find((s) => s.id === idea.currentStageId);
  const cfg = stage ? stageConfigOf(challenge, stage.id) : null;
  const criteria = stage ? criteriaOf(challenge, stage.id) : [];
  const cons = stage ? consolidate(challenge, stage.id, idea.evaluations) : null;
  const assigned = stage ? (idea.assignments[stage.id] ?? []) : [];
  const options = stage ? nextStages(funnel, idea) : [];
  const ready = stage ? isReady(challenge, stage, idea) : false;

  const [justification, setJustification] = useState(idea.decision?.justification ?? "");
  const [result, setResult] = useState<"aprovada" | "reprovada">(idea.decision?.result ?? "aprovada");
  const [feedbackText, setFeedbackText] = useState(idea.feedback?.message ?? "");

  const author = users.find((u) => u.id === idea.authorId)?.name ?? "Autor";

  return (
    <>
      <DialogHeader>
        <DialogTitle>{idea.title}</DialogTitle>
        <DialogDescription>
          {author} · etapa atual: {stage?.name ?? "fora do funil"}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">{idea.description}</p>

        {stage && (
          <section className="rounded-xl border bg-card p-4">
            <p className="label-caps">Distribuição desta etapa</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Escolha entre o pool de avaliadores elegíveis do desafio.
            </p>
            <div className="mt-3 space-y-2">
              {challenge.evaluatorPoolIds.map((id) => (
                <label key={id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={assigned.includes(id)}
                    onCheckedChange={(v) =>
                      assignEvaluators(
                        idea.id,
                        stage.id,
                        v ? [...assigned, id] : assigned.filter((x) => x !== id),
                      )
                    }
                  />
                  {users.find((u) => u.id === id)?.name ?? id}
                </label>
              ))}
              {challenge.evaluatorPoolIds.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  O desafio ainda não tem pool de avaliadores.
                </p>
              )}
            </div>
          </section>
        )}

        {stage?.mechanism === "nota" && cons && cfg && (
          <section className="rounded-xl border bg-card p-4">
            <p className="label-caps">Avaliações · {consolidationLabel[cfg.consolidation]}</p>
            {cfg.consolidation !== "individual" && (
              <p className="mt-2 text-2xl font-semibold text-primary">
                {formatScore(cons.value)} <span className="text-sm font-normal">/ 10</span>
              </p>
            )}
            <ul className="mt-3 space-y-2 text-sm">
              {idea.evaluations
                .filter((e) => e.stageId === stage.id)
                .map((e) => (
                  <li key={e.id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="font-medium">
                        {users.find((u) => u.id === e.evaluatorId)?.name ?? e.evaluatorId}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatScore(
                          cons.perEvaluator.find((p) => p.evaluatorId === e.evaluatorId)?.score ?? null,
                        )}
                        {e.locked ? " · travada" : ""}
                        {e.edited ? ` · editado em ${formatDateTime(e.updatedAt ?? e.createdAt)}` : ""}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {criteria.map((c) => `${c.name}: ${e.scores[c.id] ?? 0}/${c.scaleMax}`).join(" · ")}
                    </p>
                    <p className="mt-2">{e.comment}</p>
                  </li>
                ))}
              {idea.evaluations.filter((e) => e.stageId === stage.id).length === 0 && (
                <li className="text-muted-foreground">Nenhuma avaliação registrada nesta etapa.</li>
              )}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              {idea.evaluations.filter((e) => e.stageId === stage.id).length} de {cfg.evaluatorsNeeded}{" "}
              avaliação(ões) necessária(s) · veículo: {cfg.vehicle || "não informado"}
            </p>
          </section>
        )}

        {stage?.mechanism === "classificacao" && (
          <section className="rounded-xl border bg-card p-4">
            <p className="label-caps">Classificação</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {stage.classificationOptions.map((opt) => {
                const chosen = idea.classifications.find((c) => c.stageId === stage.id)?.option === opt;
                return (
                  <Button
                    key={opt}
                    variant={chosen ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      classifyIdea(idea.id, stage.id, opt);
                      toast.success(`Classificada como ${opt}`);
                    }}
                  >
                    {opt}
                  </Button>
                );
              })}
              {stage.classificationOptions.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma opção cadastrada para esta etapa no funil do programa.
                </p>
              )}
            </div>
            {idea.classifications
              .filter((c) => c.stageId === stage.id)
              .map((c) => (
                <p key={c.at} className="mt-3 text-xs text-muted-foreground">
                  {c.option} · por {users.find((u) => u.id === c.byId)?.name ?? c.byId} em{" "}
                  {formatDateTime(c.at)}
                </p>
              ))}
          </section>
        )}

        <section className="rounded-xl border bg-card p-4">
          <p className="label-caps">Decisão final (ata sempre gerada)</p>
          {idea.decision ? (
            <div className="mt-3 space-y-2 text-sm">
              <p className="font-medium">
                {idea.decision.result === "aprovada" ? "Aprovada" : "Não aprovada"} ·{" "}
                {formatDateTime(idea.decision.at)}
              </p>
              <p>{idea.decision.justification}</p>
              <pre className="mt-2 rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">
                {idea.decision.minutes}
              </pre>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <div>
                <Label className="label-caps">Resultado</Label>
                <Select value={result} onValueChange={(v) => setResult(v as typeof result)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aprovada">Aprovada</SelectItem>
                    <SelectItem value="reprovada">Não aprovada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="label-caps">Justificativa</Label>
                <Textarea
                  rows={3}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  if (!justification.trim()) {
                    toast.error("Escreva a justificativa da decisão.");
                    return;
                  }
                  decideIdea(idea.id, result, justification.trim());
                  toast.success("Decisão registrada com ata");
                }}
              >
                Registrar decisão e gerar ata
              </Button>
            </div>
          )}
        </section>

        <section className="rounded-xl border bg-card p-4">
          <p className="label-caps">Comunicação ao autor</p>
          <p className="mt-1 text-xs text-muted-foreground">
            O rascunho pode ser gerado por IA simulada, mas nada é enviado sem aprovação manual.
          </p>
          <Textarea
            className="mt-3"
            rows={6}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Escreva a mensagem ao autor da ideia."
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFeedbackText(
                  aiFeedbackFromEvaluations({
                    ideaTitle: idea.title,
                    authorName: author,
                    comments: idea.evaluations.map((e) => e.comment),
                    approved: idea.decision ? idea.decision.result === "aprovada" : undefined,
                  }),
                )
              }
            >
              Gerar rascunho com IA
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!feedbackText.trim()) {
                  toast.error("Escreva ou gere a mensagem antes de salvar.");
                  return;
                }
                setIdeaFeedback(idea.id, feedbackText.trim(), "manual");
                toast.success("Rascunho salvo — falta aprovar o envio");
              }}
            >
              Salvar rascunho
            </Button>
            <Button
              size="sm"
              disabled={!idea.feedback || idea.feedback.approved}
              onClick={() => {
                approveFeedback(idea.id);
                toast.success("Feedback aprovado e enviado ao autor");
              }}
            >
              Aprovar e enviar
            </Button>
          </div>
          {idea.feedback?.approved && (
            <p className="mt-3 text-xs text-success">
              Enviado por {idea.feedback.approvedBy} em {formatDateTime(idea.feedback.approvedAt!)}
            </p>
          )}
          {idea.feedback && !idea.feedback.approved && (
            <p className="mt-3 text-xs text-warning">
              Rascunho aguardando aprovação de {currentUser.name} ou de outro responsável.
            </p>
          )}
        </section>

        <section className="rounded-xl border bg-card p-4">
          <p className="label-caps">Histórico de etapas</p>
          <ul className="mt-3 space-y-2 text-sm">
            {idea.stageHistory.map((v, idx) => (
              <li key={idx} className="rounded-lg border p-3">
                <p className="font-medium">
                  {funnel.stages.find((s) => s.id === v.stageId)?.name ?? v.stageId}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Entrou em {formatDateTime(v.enteredAt)}
                  {v.exitedAt ? ` · saiu em ${formatDateTime(v.exitedAt)} · movida por ${v.movedBy}` : " · em andamento"}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {stage && (
          <section className="rounded-xl border bg-card p-4">
            <p className="label-caps">Avanço manual</p>
            <p className="mt-2 text-sm">
              {ready
                ? "Sinal de prontidão atingido. O avanço continua dependendo de uma ação sua."
                : `Sinal de prontidão ainda não atingido${stage.readiness ? `: ${stage.readiness}` : ""}. Você pode avançar mesmo assim.`}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {options.map((o) => (
                <Button
                  key={o.stage.id}
                  variant={ready ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    advanceIdea(idea.id, o.stage.id);
                    toast.success(`Ideia avançou para ${o.stage.name}`);
                  }}
                >
                  Avançar para {o.stage.name}
                  {o.condition ? ` (${o.condition})` : ""}
                </Button>
              ))}
              {options.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma etapa seguinte disponível a partir daqui — verifique as transições e a
                  classificação registrada.
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
