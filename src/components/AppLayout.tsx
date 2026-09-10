import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useApp } from "@/lib/store";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const roleLabels: Record<Role, string> = {
  admin: "Administrador",
  gestor: "Gestor da inovação",
  usuario: "Usuário comum",
};

export function AppLayout({ children }: { children: ReactNode }) {
  const { role, setRole, currentUser } = useApp();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const nav =
    role === "usuario"
      ? [{ to: "/explorar", label: "Desafios abertos" }]
      : [
          { to: "/", label: "Visão geral" },
          { to: "/programas", label: "Programas" },
          { to: "/objetivos", label: "Objetivos estratégicos" },
          { to: "/desafios", label: "Desafios" },
          { to: "/explorar", label: "Visão pública" },
        ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <Link to="/" className="text-lg font-semibold text-primary">
            Avantti
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            {nav.map((n) => {
              const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-primary-soft font-medium text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:block">{currentUser.name}</span>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger className="w-52" aria-label="Trocar papel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-primary">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
