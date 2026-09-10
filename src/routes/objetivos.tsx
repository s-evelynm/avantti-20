import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  const { objectives, addObjective, updateObjective, deleteObjective, objectiveInUse, challenges, caps } =
    useApp();
  const [editing, setEditing] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const readOnly = !caps.configurar;

  return (
    <div>
      <PageHeader
        title="Objetivos estratégicos"
        description="Entidade independente. Só pode ser editada ou removida quando não está vinculada a nenhum desafio."
        action={!readOnly ? <NovoObjetivoDialog onCreated={(name) => setHighlight(name)} /> : undefined}
      />

      <ul className="space-y-4">
        {objectives.map((o) => {
          const used = objectiveInUse(o.id);
          const linked = challenges.filter((c) => c.objectiveIds.includes(o.id));
          const isEditing = editing === o.id;
          const isNew = highlight === o.name;
          return (
            <li
              key={o.id}
              className={
                isNew
                  ? "rounded-xl border border-l-[3px] border-l-primary bg-card p-4 ring-2 ring-primary"
                  : "rounded-xl border border-l-[3px] border-l-primary bg-card p-4"
              }
            >
              {isEditing ? (
                <EditObjetivo
                  id={o.id}
                  name={o.name}
                  description={o.description}
                  onCancel={() => setEditing(null)}
                  onSave={(name, description) => {
                    updateObjective(o.id, { name, description });
                    setEditing(null);
                    toast.success("Objetivo atualizado");
                  }}
                />
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium">{o.name}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{o.description}</p>
                    </div>
                    {!readOnly && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" disabled={used} onClick={() => setEditing(o.id)}>
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
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
                  <p className="mt-4 text-xs">
                    {used ? (
                      <span className="rounded bg-warning-bg px-2 py-1 text-warning">
                        Bloqueado para edição — vinculado a {linked.length} desafio(s)
                      </span>
                    ) : (
                      <span className="rounded bg-success-bg px-2 py-1 text-success">Livre para editar</span>
                    )}
                    {isNew && (
                      <span className="ml-2 rounded bg-primary-soft px-2 py-1 text-primary">
                        Criado agora
                      </span>
                    )}
                  </p>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function NovoObjetivoDialog({ onCreated }: { onCreated: (name: string) => void }) {
  const { addObjective } = useApp();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!name.trim()) {
      setError("Informe o nome do objetivo.");
      return;
    }
    addObjective({ name: name.trim(), description: description.trim() });
    onCreated(name.trim());
    toast.success(`Objetivo "${name.trim()}" criado`);
    setName("");
    setDescription("");
    setError("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Novo objetivo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo objetivo estratégico</DialogTitle>
          <DialogDescription>
            O objetivo fica disponível para ser vinculado a qualquer desafio.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="label-caps" htmlFor="obj-nome">
              Nome
            </Label>
            <Input
              id="obj-nome"
              value={name}
              aria-invalid={!!error}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              className={error ? "border-danger focus-visible:ring-danger" : ""}
            />
            {error && <p className="mt-2 text-sm text-danger">{error}</p>}
          </div>
          <div>
            <Label className="label-caps" htmlFor="obj-desc">
              Descrição
            </Label>
            <Textarea id="obj-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={submit}>Criar objetivo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditObjetivo({
  id,
  name: initialName,
  description: initialDescription,
  onSave,
  onCancel,
}: {
  id: string;
  name: string;
  description: string;
  onSave: (name: string, description: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <Label className="label-caps" htmlFor={`nome-${id}`}>
          Nome
        </Label>
        <Input
          id={`nome-${id}`}
          value={name}
          aria-invalid={!!error}
          className={error ? "border-danger focus-visible:ring-danger" : ""}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError("");
          }}
        />
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>
      <div>
        <Label className="label-caps" htmlFor={`desc-${id}`}>
          Descrição
        </Label>
        <Textarea id={`desc-${id}`} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => {
            if (!name.trim()) {
              setError("Informe o nome do objetivo.");
              return;
            }
            onSave(name.trim(), description.trim());
          }}
        >
          Salvar
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
