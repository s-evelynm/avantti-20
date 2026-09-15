import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppLayout";
import { FormBuilder } from "@/components/FormBuilder";
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
import { useApp } from "@/lib/store";
import { aiChallengeFromText } from "@/lib/ai-mock";
import type { FormField } from "@/lib/types";

export const Route = createFileRoute("/desafios/novo")({
  validateSearch: (s: Record<string, unknown>) => ({ programa: (s['programa'] as string) || "" }),
  head: () => ({
    meta: [
      { title: "Novo desafio — Avantti" },
      {
        name: "description",
        content: "Crie um desafio manualmente ou gere um rascunho com IA simulada, sempre com aprovação humana.",
      },
      { property: "og:title", content: "Novo desafio — Avantti" },
      { property: "og:description", content: "Criação de desafios com formulário de submissão configurável." },
    ],
  }),
  component: NovoDesafio,
});

function NovoDesafio() {
  const { programa } = Route.useSearch();
  const { programs, objectives, users, addChallenge } = useApp();
  const navigate = useNavigate();

  const [programId, setProgramId] = useState(programa || programs[0]?.id || "");
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [objectiveIds, setObjectiveIds] = useState<string[]>([]);
  const [kind, setKind] = useState<"pontual" | "continuo">("pontual");
  const [deadline, setDeadline] = useState("");
  const [ownerId, setOwnerId] = useState(users[0]?.id ?? "");
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [aiText, setAiText] = useState("");
  const [aiDraft, setAiDraft] = useState(false);

  const create = (origin?: string) => {
    if (!title.trim()) {
      toast.error("Informe o título do desafio");
      return;
    }
    if (!programId) {
      toast.error("Selecione o programa");
      return;
    }
    if (objectiveIds.length === 0) {
      toast.error("Selecione ao menos um objetivo estratégico");
      return;
    }
    const c = addChallenge(
      {
        programId,
        title: title.trim(),
        context: context.trim(),
        objectiveIds,
        formFields,
        kind,
        deadline: kind === "pontual" ? deadline || undefined : undefined,
        ownerId,
      },
      origin,
    );
    toast.success("Desafio criado como Rascunho");
    navigate({ to: "/desafios/$challengeId", params: { challengeId: c.id }, search: { aba: "visao" } });
  };

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Novo desafio"
        description="Todo desafio nasce como Rascunho e só fica visível ao público quando você o abre."
      />

      <Tabs defaultValue="manual">
        <TabsList>
          <TabsTrigger value="manual">Criação manual</TabsTrigger>
          <TabsTrigger value="ia">Gerar com IA (simulada)</TabsTrigger>
        </TabsList>

        <TabsContent value="ia" className="mt-4 space-y-4">
          <div className="rounded-lg bg-primary-soft p-3 text-sm">
            A geração é simulada. O rascunho preenche os campos da aba de criação manual e só é salvo
            depois da sua aprovação.
          </div>
          <div>
            <Label className="label-caps">Descreva o problema em texto livre</Label>
            <Textarea rows={5} value={aiText} onChange={(e) => setAiText(e.target.value)} />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              const d = aiChallengeFromText(aiText || "problema operacional recorrente");
              setTitle(d.title);
              setContext(d.context);
              setFormFields(d.suggestedFields);
              setAiDraft(true);
              toast.info("Rascunho gerado — revise antes de aprovar");
            }}
          >
            Gerar rascunho com IA
          </Button>
          {aiDraft && (
            <div className="rounded-lg border border-l-[3px] border-l-brand-pink bg-card p-4 text-sm">
              Rascunho aplicado nos campos de criação manual. Revise título, contexto, objetivos e
              formulário antes de salvar.
            </div>
          )}
        </TabsContent>

        <TabsContent value="manual" className="mt-4 space-y-5">
          <div>
            <Label className="label-caps">Programa</Label>
            <Select value={programId} onValueChange={setProgramId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="label-caps">Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label className="label-caps">Contexto</Label>
            <Textarea rows={5} value={context} onChange={(e) => setContext(e.target.value)} />
          </div>
          <div>
            <Label className="label-caps">Objetivos estratégicos (1 ou mais)</Label>
            <div className="mt-2 grid gap-2 rounded-lg border bg-card p-3 sm:grid-cols-2">
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
              <Select value={kind} onValueChange={(v) => setKind(v as "pontual" | "continuo")}>
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
              <Label className="label-caps">Patrocinador do desafio</Label>
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
          <div>
            <Label className="label-caps">Formulário de submissões</Label>
            <div className="mt-2">
              <FormBuilder fields={formFields} onChange={setFormFields} />
            </div>
          </div>
          <Button onClick={() => create(aiDraft ? "Desafio gerado por IA e aprovado por humano." : undefined)}>
            Criar desafio
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
