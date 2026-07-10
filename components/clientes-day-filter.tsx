"use client";

import { useRouter } from "next/navigation";
import { DIAS_SEMANA } from "@/lib/constants";

export function ClientesDayFilter({ dia }: { dia: string | null }) {
  const router = useRouter();
  const diaActual = dia ?? "";

  const opciones = [
    { value: "", label: "Todos los días" },
    ...DIAS_SEMANA.map((d) => ({ value: d.id, label: d.labelLargo })),
  ];

  return (
    <div className="space-y-2">
      <label htmlFor="filtro-dia" className="text-sm font-medium text-muted-foreground">
        Filtrar por día de visita
      </label>
      <select
        id="filtro-dia"
        value={diaActual}
        onChange={(e) => {
          const value = e.target.value;
          router.push(value ? `/clientes?dia=${value}` : "/clientes");
        }}
        className="h-14 w-full rounded-xl border border-border bg-background px-4 text-base outline-none ring-ring focus-visible:ring-2"
      >
        {opciones.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
    </div>
  );
}
