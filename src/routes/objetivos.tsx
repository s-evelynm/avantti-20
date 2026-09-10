import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/objetivos")({
  head: () => ({
    meta: [
      { title: "Objetivos estratégicos — Avantti" },
      {
        name: "description",
        content: "Cadastre e mantenha os objetivos estratégicos vinculados aos desafios de inovação.",
      },
      { property: "og:title", content: "Objetivos estratégicos — Avantti" },
      { property: "og:description", content: "Objetivos estratégicos usados pelos desafios." },
    ],
  }),
  component: ObjetivosPage,
});

function ObjetivosPage() {
  const { objectives, addObjective, updateObjective, deleteObjective, objectiveInUse, challenges, role } =
    useApp();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const readOnly = role !== "admin";

  return (
    <div>
      <PageHeader
        title="Objetivos estratégicos"
        description="Entidade independente. Só pode ser editada ou removida quando não está vinculada a nenhum desafio."
      />

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <ul className="space-y-3">
          {objectives.map((o) => {
            const used = objectiveInUse(o.id);
            const linked = challenges.filter((c) => c.objectiveIds.includes(o.id));
            const isEditing = editing === o.id;
            return (
              <li key={o.id} className="rounded-xl border border-l-[3px] border-l-primary bg-card p-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <Input defaultValue={o.name} id={`name-${o.id}`} />
                    <Textarea defaultValue={o.description} id={`desc-${o.id}`} />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          const n = (document.getElementById(`name-${o.id}`) as HTMLInputElement).value;
                          const d = (document.getElementById(`desc-${o.id}`) as HTMLTextAreaElement).value;
                          updateObjective(o.id, { name: n, description: d });
                          setEditing(null);
                          toast.success("Objetivo atualizado");
                        }}
                      >
                        Salvar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium">{o.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{o.description}</p>
                      </div>
                      {!readOnly && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" disabled={used} onClick={() => setEditing(o.id)}>
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={used}
                            onClick={() => {
                              deleteObjective(o.id);
                              toast.success("Objetivo excluído");
                            }}
                          >
                            Excluir
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-xs">
                      {used ? (
                        <span className="rounded bg-warning-bg px-2 py-1 text-warning">
                          Bloqueado para edição — vinculado a {linked.length} desafio(s)
                        </span>
                      ) : (
                        <span className="rounded bg-success-bg px-2 py-1 text-success">Livre para editar</span>
                      )}
                    </p>
                  </>
                )}
              </li>
            );
          })}
        </ul>

        {!readOnly && (
          <aside className="h-fit rounded-xl border bg-card p-4">
            <h2 className="mb-3 text-base font-semibold">Novo objetivo</h2>
            <div className="space-y-3">
              <div>
                <Label className="label-caps">Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label className="label-caps">Descrição</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  if (!name.trim()) {
                    toast.error("Informe o nome do objetivo");
                    return;
                  }
                  addObjective({ name: name.trim(), description: description.trim() });
                  setName("");
                  setDescription("");
                  toast.success("Objetivo criado");
                }}
              >
                Criar objetivo
              </Button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
