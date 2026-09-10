import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppLayout";
import { FormBuilder } from "@/components/FormBuilder";
import { HistoryList } from "@/components/HistoryList";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useApp, formatDate, formatDateTime, isExpired } from "@/lib/store";
import { aiReviewChallenge, type ReviewItem } from "@/lib/ai-mock";
import type { ChallengeStatus } from "@/lib/types";

export const Route = createFileRoute("/desafios/$challengeId")({
  head: () => ({
    meta: [
      { title: "Desafio — Avantti" },
      {
        name: "description",
        content: "Detalhe do desafio: contexto, objetivos, formulário de submissões, estado, ideias e histórico.",
      },
      { property: "og:title", content: "Desafio — Avantti" },
      { property: "og:description", content: "Estado, formulário configurável e ideias submetidas do desafio." },
    ],
  }),
  component: DesafioDetalhe,
});

function DesafioDetalhe() {
  const { challengeId } = Route.useParams();
  const navigate = useNavigate();
  const {
    challenges,
    programs,
    objectives,
    users,
    ideas,
    role,
    updateChallenge,
    setChallengeStatus,
    deleteChallenge,
    logsFor,
  } = useApp();

  const challenge = challenges.find((c) => c.id === challengeId);
  const [editing, setEditing] = useState(false);
  const [review, setReview] = useState<ReviewItem[] | null>(null);

  if (!challenge)
    return (
      <div>
        <p className="text-muted-foreground">Desafio não encontrado.</p>
        <Link to="/desafios" className="text-primary underline">
          Voltar para desafios
        </Link>
      </div>
    );

  const isAdmin = role === "admin";
  const program = programs.find((p) => p.id === challenge.programId);
  const challengeIdeas = ideas.filter((i) => i.challengeId === challenge.id);
  const expired = isExpired(challenge);

  const transitions: { to: ChallengeStatus; label: string; show: boolean }[] = [
    { to: "aberto", label: "Publicar (abrir)", show: challenge.status === "rascunho" },
    { to: "pausado", label: "Pausar submissões", show: challenge.status === "aberto" },
    { to: "aberto", label: "Retomar (abrir)", show: challenge.status === "pausado" },
    {
      to: "aberto",
      label: "Reabrir (exige prazo estendido)",
      show: challenge.status === "encerrado",
    },
    { to: "encerrado", label: "Encerrar submissões", show: challenge.status === "aberto" },
  ];

  return (
    <div>
      <PageHeader
        title={challenge.title}
        description={`Programa: ${program?.name ?? "—"}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={challenge.status} />
            {isAdmin && (
              <>
                <Button variant="outline" onClick={() => setEditing((v) => !v)}>
                  {editing ? "Fechar edição" : "Editar"}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">Excluir</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-danger">Excluir este desafio?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {challengeIdeas.length} ideia(s) vinculada(s) serão excluídas junto e não
                        poderão ser recuperadas. Confirme apenas se tiver certeza.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          deleteChallenge(challenge.id);
                          toast.success("Desafio excluído");
                          navigate({ to: "/desafios" });
                        }}
                      >
                        Excluir desafio e ideias
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        }
      />

      {expired && challenge.status === "aberto" && (
        <div className="mb-4 rounded-lg bg-warning-bg p-3 text-sm text-warning">
          O prazo deste desafio expirou ({formatDate(challenge.deadline)}). Encerre as submissões ou
          estenda o prazo.
        </div>
      )}

      {isAdmin && (
        <div className="mb-6 flex flex-wrap gap-2">
          {transitions
            .filter((t) => t.show)
            .map((t) => (
              <Button
                key={t.label}
                variant={t.to === "aberto" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (
                    challenge.status === "encerrado" &&
                    challenge.kind === "pontual" &&
                    isExpired(challenge)
                  ) {
                    toast.error("Estenda o prazo na aba de edição antes de reabrir.");
                    return;
                  }
                  setChallengeStatus(challenge.id, t.to);
                  toast.success("Status atualizado");
                }}
              >
                {t.label}
              </Button>
            ))}
        </div>
      )}

      {editing && isAdmin && <EditPanel challengeId={challenge.id} onDone={() => setEditing(false)} />}

      <Tabs defaultValue="detalhes">
        <TabsList>
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="formulario">Formulário</TabsTrigger>
          <TabsTrigger value="ideias">Ideias ({challengeIdeas.length})</TabsTrigger>
          <TabsTrigger value="ia">Revisão por IA</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className="mt-4 space-y-4">
          <div className="rounded-xl border bg-card p-4">
            <p className="label-caps">Contexto</p>
            <p className="mt-1 whitespace-pre-line">{challenge.context || "Sem contexto."}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Info label="Tipo" value={challenge.kind === "pontual" ? "Pontual" : "Contínuo"} />
            <Info
              label="Prazo"
              value={challenge.kind === "pontual" ? formatDate(challenge.deadline) : "Sem prazo"}
            />
            <Info label="Dono / sponsor" value={users.find((u) => u.id === challenge.ownerId)?.name ?? "—"} />
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="label-caps">Objetivos estratégicos</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {challenge.objectiveIds.map((id) => (
                <li key={id} className="rounded-full bg-primary-soft px-3 py-1 text-sm text-primary">
                  {objectives.find((o) => o.id === id)?.name ?? id}
                </li>
              ))}
            </ul>
          </div>
          {challenge.status !== "rascunho" && (
            <Link
              to="/explorar/$challengeId"
              params={{ challengeId: challenge.id }}
              className="inline-block text-sm text-primary underline"
            >
              Ver página pública do desafio
            </Link>
          )}
        </TabsContent>

        <TabsContent value="formulario" className="mt-4 space-y-4">
          <div className="rounded-lg bg-warning-bg p-3 text-sm text-warning">
            Editar o formulário afeta apenas submissões futuras. As ideias já enviadas mantêm a
            estrutura e os dados do momento do envio.
          </div>
          {isAdmin ? (
            <FormBuilder
              fields={challenge.formFields}
              onChange={(f) =>
                updateChallenge(challenge.id, { formFields: f }, "Formulário de submissões alterado (vale para submissões futuras).")
              }
            />
          ) : (
            <ul className="space-y-2">
              {challenge.formFields.map((f) => (
                <li key={f.id} className="rounded-lg border bg-card p-3 text-sm">
                  {f.label}
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="ideias" className="mt-4 space-y-3">
          {challengeIdeas.map((i) => (
            <article key={i.id} className="rounded-xl border border-l-[3px] border-l-brand-pink bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium">{i.title}</h3>
                <span className="text-xs text-muted-foreground">
                  {users.find((u) => u.id === i.authorId)?.name ?? "Anônimo"} · {formatDateTime(i.createdAt)}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{i.description}</p>
              {i.link && <p className="mt-1 text-sm text-primary">{i.link}</p>}
              {i.attachments.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">Anexos: {i.attachments.join(", ")}</p>
              )}
              <dl className="mt-3 space-y-1 text-sm">
                {i.formSnapshot.map((f) => (
                  <div key={f.id}>
                    <dt className="label-caps">{f.label}</dt>
                    <dd>
                      {Array.isArray(i.answers[f.id])
                        ? (i.answers[f.id] as string[]).join(", ")
                        : ((i.answers[f.id] as string) ?? "—")}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                Estrutura preservada conforme o formulário vigente no envio.
              </p>
            </article>
          ))}
          {challengeIdeas.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma ideia submetida ainda.</p>
          )}
        </TabsContent>

        <TabsContent value="ia" className="mt-4 space-y-4">
          <div className="rounded-lg bg-primary-soft p-3 text-sm">
            Revisão simulada de escrita e lacunas. Nada é alterado automaticamente — você decide o que
            corrigir antes de publicar.
          </div>
          <Button variant="outline" onClick={() => setReview(aiReviewChallenge(challenge))}>
            Revisar desafio com IA
          </Button>
          {review && (
            <ul className="space-y-2">
              {review.map((r, idx) => (
                <li
                  key={idx}
                  className={`rounded-lg p-3 text-sm ${
                    r.level === "lacuna" ? "bg-danger-bg text-danger" : "bg-info-bg text-info"
                  }`}
                >
                  <p className="font-medium">{r.title}</p>
                  <p className="mt-1 text-foreground">{r.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <HistoryList entries={logsFor(challenge.id)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="label-caps">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}

function EditPanel({ challengeId, onDone }: { challengeId: string; onDone: () => void }) {
  const { challenges, objectives, users, updateChallenge } = useApp();
  const c = challenges.find((x) => x.id === challengeId)!;
  const [title, setTitle] = useState(c.title);
  const [context, setContext] = useState(c.context);
  const [objectiveIds, setObjectiveIds] = useState(c.objectiveIds);
  const [kind, setKind] = useState(c.kind);
  const [deadline, setDeadline] = useState(c.deadline ?? "");
  const [ownerId, setOwnerId] = useState(c.ownerId);

  return (
    <div className="mb-6 space-y-4 rounded-xl border bg-card p-4">
      <div>
        <Label className="label-caps">Título</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <Label className="label-caps">Contexto</Label>
        <Textarea rows={4} value={context} onChange={(e) => setContext(e.target.value)} />
      </div>
      <div>
        <Label className="label-caps">Objetivos estratégicos</Label>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {objectives.map((o) => (
            <label key={o.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={objectiveIds.includes(o.id)}
                onCheckedChange={(v) =>
                  setObjectiveIds(v ? [...objectiveIds, o.id] : objectiveIds.filter((x) => x !== o.id))
                }
              />
              {o.name}
            </label>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label className="label-caps">Tipo</Label>
          <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pontual">Pontual</SelectItem>
              <SelectItem value="continuo">Contínuo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="label-caps">Prazo</Label>
          <Input
            type="date"
            value={deadline}
            disabled={kind === "continuo"}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
        <div>
          <Label className="label-caps">Dono / sponsor</Label>
          <Select value={ownerId} onValueChange={setOwnerId}>
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
      </div>
      <Button
        onClick={() => {
          if (objectiveIds.length === 0) {
            toast.error("O desafio precisa de ao menos um objetivo estratégico");
            return;
          }
          updateChallenge(
            c.id,
            {
              title,
              context,
              objectiveIds,
              kind,
              deadline: kind === "pontual" ? deadline || undefined : undefined,
              ownerId,
            },
            "Dados do desafio atualizados (título, contexto, objetivos, tipo, prazo ou dono).",
          );
          toast.success("Desafio atualizado");
          onDone();
        }}
      >
        Salvar alterações
      </Button>
    </div>
  );
}
