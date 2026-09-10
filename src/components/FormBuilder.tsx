import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import type { FieldType, FormField } from "@/lib/types";

const typeLabels: Record<FieldType, string> = {
  curto: "Texto curto",
  longo: "Texto longo",
  unica: "Seleção única",
  multipla: "Seleção múltipla",
};

export function FormBuilder({
  fields,
  onChange,
}: {
  fields: FormField[];
  onChange: (f: FormField[]) => void;
}) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<FieldType>("curto");
  const [options, setOptions] = useState("");

  const add = () => {
    if (!label.trim()) return;
    onChange([
      ...fields,
      {
        id: Math.random().toString(36).slice(2, 10),
        label: label.trim(),
        type,
        options:
          type === "unica" || type === "multipla"
            ? options.split(",").map((o) => o.trim()).filter(Boolean)
            : [],
        required: false,
      },
    ]);
    setLabel("");
    setOptions("");
    setType("curto");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-primary-soft p-3 text-sm">
        Campos fixos em todo formulário: <strong>título</strong>, <strong>descrição</strong>,{" "}
        <strong>link</strong> e <strong>anexos</strong>. Adicione abaixo os campos específicos deste
        desafio.
      </div>

      <ul className="space-y-2">
        {fields.map((f, i) => (
          <li
            key={f.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-l-[3px] border-l-primary bg-card p-3"
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {i + 1}
            </span>
            <div className="min-w-40 flex-1">
              <p className="text-sm font-medium">{f.label}</p>
              <p className="text-xs text-muted-foreground">
                {typeLabels[f.type]}
                {f.options.length > 0 ? ` · ${f.options.join(", ")}` : ""}
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                checked={f.required}
                onCheckedChange={(v) =>
                  onChange(fields.map((x) => (x.id === f.id ? { ...x, required: !!v } : x)))
                }
              />
              Obrigatório
            </label>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remover campo"
              onClick={() => onChange(fields.filter((x) => x.id !== f.id))}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
        {fields.length === 0 && (
          <li className="text-sm text-muted-foreground">Nenhum campo específico ainda.</li>
        )}
      </ul>

      <div className="grid gap-3 rounded-lg border bg-card p-3 md:grid-cols-[2fr_1fr_2fr_auto]">
        <div>
          <Label className="label-caps">Pergunta</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Qual o impacto esperado?" />
        </div>
        <div>
          <Label className="label-caps">Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as FieldType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(typeLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="label-caps">Opções (separadas por vírgula)</Label>
          <Input
            value={options}
            disabled={type === "curto" || type === "longo"}
            onChange={(e) => setOptions(e.target.value)}
            placeholder="Conceito, Protótipo, Piloto"
          />
        </div>
        <div className="flex items-end">
          <Button onClick={add}>
            <Plus className="size-4" /> Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}
