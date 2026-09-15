import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp, formatDate } from "@/lib/store";

export const Route = createFileRoute("/explorar/$challengeId")({
  head: () => ({
    meta: [
      { title: "Página pública do desafio — Avantti" },
      {
        name: "description",
        content: "Página pública do desafio: contexto, prazo e formulário para submeter sua ideia.",
      },
      { property: "og:title", content: "Página pública do desafio — Avantti" },
      { property: "og:description", content: "Envie sua ideia para o desafio de inovação." },
    ],
  }),
  component: PaginaPublica,
});

function PaginaPublica() {
  const { challengeId } = Route.useParams();
  const { challenges, programs, objectives, users, currentUser, visiblePrograms, addIdea, ideas } =
    useApp();

  const challenge = challenges.find((c) => c.id === challengeId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [attachments, setAttachments] = useState("");
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  if (!challenge || challenge.status === "rascunho")
    return (
      <div>
        <p className="text-muted-foreground">Este desafio não está disponível publicamente.</p>
        <Link to="/explorar" className="text-primary underline">
          Ver desafios abertos
        </Link>
      </div>
    );

  const program = programs.find((p) => p.id === challenge.programId);
  const eligible = visiblePrograms(currentUser.id).some((p) => p.id === challenge.programId);
  const canSubmit = challenge.status === "aberto" && eligible;
  const mine = ideas.filter((i) => i.challengeId === challenge.id);

  const submit = () => {
    if (!title.trim()) {
      toast.error("Informe o título da ideia");
      return;
    }
    const missing = challenge.formFields.filter((f) => {
      const v = answers[f.id];
      return f.required && (!v || (Array.isArray(v) ? v.length === 0 : !v.trim()));
    });
    if (missing.length > 0) {
      toast.error(`Responda: ${missing[0]!.label}`);
      return;
    }
    addIdea({
      challengeId: challenge.id,
      title: title.trim(),
      description: description.trim(),
      link: link.trim(),
      attachments: attachments.split(",").map((a) => a.trim()).filter(Boolean),
      answers,
      formSnapshot: challenge.formFields,
      authorId: currentUser.id,
    });
    setTitle("");
    setDescription("");
    setLink("");
    setAttachments("");
    setAnswers({});
    toast.success("Ideia enviada");
  };

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={challenge.title}
        description={`${program?.name ?? ""} · ${
          challenge.kind === "pontual" ? `Prazo ${formatDate(challenge.deadline)}` : "Fluxo contínuo"
        }`}
        action={<StatusBadge status={challenge.status} />}
      />

      <div className="rounded-xl border bg-card p-4">
        <p className="label-caps">Contexto do desafio</p>
        <p className="mt-1 whitespace-pre-line">{challenge.context}</p>
        <p className="mt-4 label-caps">Objetivos estratégicos</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {challenge.objectiveIds.map((id) => (
            <li key={id} className="rounded-full bg-primary-soft px-3 py-1 text-sm text-primary">
              {objectives.find((o) => o.id === id)?.name}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Patrocinador do desafio: {users.find((u) => u.id === challenge.ownerId)?.name ?? "—"}
        </p>
      </div>

      {!eligible && (
        <p className="mt-4 rounded-lg bg-danger-bg p-3 text-sm text-danger">
          Seu perfil não faz parte do público elegível deste programa.
        </p>
      )}
      {eligible && challenge.status === "pausado" && (
        <p className="mt-4 rounded-lg bg-warning-bg p-3 text-sm text-warning">
          Submissões pausadas. O prazo continua correndo normalmente.
        </p>
      )}
      {eligible && challenge.status === "encerrado" && (
        <p className="mt-4 rounded-lg bg-danger-bg p-3 text-sm text-danger">
          Submissões encerradas — o prazo deste desafio expirou.
        </p>
      )}

      {canSubmit && (
        <section className="mt-6 space-y-4 rounded-xl border bg-card p-4">
          <h2 className="text-base font-semibold">Enviar minha ideia</h2>
          <div>
            <Label className="label-caps">Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label className="label-caps">Descrição</Label>
            <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="label-caps">Link</Label>
              <Input value={link} onChange={(e) => setLink(e.target.value)} />
            </div>
            <div>
              <Label className="label-caps">Anexos (nomes separados por vírgula)</Label>
              <Input value={attachments} onChange={(e) => setAttachments(e.target.value)} />
            </div>
          </div>

          {challenge.formFields.map((f) => (
            <div key={f.id}>
              <Label className="label-caps">
                {f.label} {f.required && <span className="text-brand-pink">*</span>}
              </Label>
              {f.type === "curto" && (
                <Input
                  value={(answers[f.id] as string) ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [f.id]: e.target.value })}
                />
              )}
              {f.type === "longo" && (
                <Textarea
                  rows={3}
                  value={(answers[f.id] as string) ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [f.id]: e.target.value })}
                />
              )}
              {f.type === "unica" && (
                <Select
                  value={(answers[f.id] as string) ?? ""}
                  onValueChange={(v) => setAnswers({ ...answers, [f.id]: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {f.type === "multipla" && (
                <div className="mt-2 flex flex-wrap gap-3">
                  {f.options.map((o) => {
                    const cur = (answers[f.id] as string[]) ?? [];
                    return (
                      <label key={o} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={cur.includes(o)}
                          onCheckedChange={(v) =>
                            setAnswers({
                              ...answers,
                              [f.id]: v ? [...cur, o] : cur.filter((x) => x !== o),
                            })
                          }
                        />
                        {o}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          <Button onClick={submit}>Enviar ideia</Button>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold">Ideias já submetidas ({mine.length})</h2>
        <ul className="space-y-2">
          {mine.map((i) => (
            <li key={i.id} className="rounded-lg border border-l-[3px] border-l-brand-pink bg-card p-3">
              <p className="text-sm font-medium">{i.title}</p>
              <p className="text-xs text-muted-foreground">
                {users.find((u) => u.id === i.authorId)?.name ?? "Anônimo"}
              </p>
            </li>
          ))}
          {mine.length === 0 && <li className="text-sm text-muted-foreground">Seja o primeiro a enviar.</li>}
        </ul>
      </section>
    </div>
  );
}
