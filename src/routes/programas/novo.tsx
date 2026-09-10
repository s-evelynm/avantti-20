import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from "@/lib/store";
import { aiProgramFromDocument } from "@/lib/ai-mock";

export const Route = createFileRoute("/programas/novo")({
  head: () => ({
    meta: [
      { title: "Novo programa — Avantti" },
      {
        name: "description",
        content: "Crie um programa de inovação manualmente ou a partir da leitura simulada de um documento.",
      },
      { property: "og:title", content: "Novo programa — Avantti" },
      { property: "og:description", content: "Criação manual ou assistida de programas de inovação." },
    ],
  }),
  component: NovoPrograma,
});

function NovoPrograma() {
  const { addProgram } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [context, setContext] = useState("");
  const [amount, setAmount] = useState("0");
  const [note, setNote] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [aiGenerated, setAiGenerated] = useState(false);

  const create = (origin?: string) => {
    if (!name.trim()) {
      toast.error("Informe o nome do programa");
      return;
    }
    const p = addProgram(
      {
        name: name.trim(),
        context: context.trim(),
        documentName: documentName || undefined,
        resourceAmount: Number(amount) || 0,
        resourceCurrency: "BRL",
        resourceNote: note.trim(),
        audience: { mode: "todos", areas: [], userIds: [] },
      },
      origin,
    );
    toast.success("Programa criado");
    navigate({ to: "/programas/$programId", params: { programId: p.id } });
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Novo programa" description="Crie manualmente ou gere um template a partir de um documento." />

      <Tabs defaultValue="manual">
        <TabsList>
          <TabsTrigger value="manual">Criação manual</TabsTrigger>
          <TabsTrigger value="ia">A partir de documento (IA simulada)</TabsTrigger>
        </TabsList>

        <TabsContent value="ia" className="mt-4 space-y-4">
          <div className="rounded-lg bg-primary-soft p-3 text-sm">
            A leitura do documento é simulada com uma resposta pré-definida. Nada é salvo sem sua
            aprovação: revise e edite o template antes de criar o programa.
          </div>
          <div>
            <Label className="label-caps">Documento</Label>
            <Input
              placeholder="diretrizes-inovacao.pdf"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              const draft = aiProgramFromDocument(documentName || "documento.pdf");
              setName(draft.name);
              setContext(draft.context);
              setAmount(String(draft.resourceAmount));
              setNote(draft.resourceNote);
              setAiGenerated(true);
              toast.info("Template gerado — revise antes de aprovar");
            }}
          >
            Gerar template com IA
          </Button>
          {aiGenerated && (
            <div className="rounded-lg border border-l-[3px] border-l-brand-pink bg-card p-4">
              <p className="label-caps">Template aguardando aprovação</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Os campos da aba "Criação manual" foram preenchidos com a sugestão. Ajuste o que for
                preciso e confirme para salvar.
              </p>
              <Button className="mt-3" onClick={() => create("Programa gerado por IA a partir de documento e aprovado por humano.")}>
                Aprovar e criar programa
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="manual" className="mt-4 space-y-4">
          <div>
            <Label className="label-caps">Nome do programa</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label className="label-caps">Contexto</Label>
            <Textarea rows={5} value={context} onChange={(e) => setContext(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="label-caps">Recurso (R$)</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label className="label-caps">Documento anexado (opcional)</Label>
              <Input value={documentName} onChange={(e) => setDocumentName(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="label-caps">Observação sobre o recurso</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button onClick={() => create()}>Criar programa</Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
