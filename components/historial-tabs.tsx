"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  formatearDinero,
  formatearFecha,
  ProductoId,
  etiquetaProducto,
  CATEGORIAS_GASTO,
} from "@/lib/constants";
import {
  getHistorialResumen,
  getHistorialGastos,
} from "@/app/actions";
import {
  Banknote,
  Package,
  TrendingDown,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  CalendarDays,
} from "lucide-react";

type Periodo = "hoy" | "semana" | "mes";

type ResumenData = NonNullable<
  Awaited<ReturnType<typeof getHistorialResumen>>
>;

type GastoItem = Awaited<ReturnType<typeof getHistorialGastos>>[number];

type ResumenGastoItem = ResumenData["gastos"][number];

type VentaItem = { producto: ProductoId; cantidad: number };

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: "hoy", label: "Hoy" },
  { id: "semana", label: "Esta semana" },
  { id: "mes", label: "Este mes" },
];

export function HistorialTabs() {
  const [vista, setVista] = useState<"resumen" | "gastos">("resumen");
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<ResumenData | null>(null);
  const [gastos, setGastos] = useState<GastoItem[] | null>(null);
  const [expandedRegistros, setExpandedRegistros] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    async function cargar() {
      setLoading(true);
      try {
        const [r, g] = await Promise.all([
          getHistorialResumen(periodo),
          getHistorialGastos(periodo),
        ]);
        setResumen(r);
        setGastos(g);
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Algo salió mal. Revisá tu conexión e intentá de nuevo."
        );
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, [periodo]);

  const ventasPorRegistro = useMemo(() => {
    const map = new Map<string, VentaItem[]>();
    if (!resumen) return map;
    for (const r of resumen.registros) {
      map.set(
        r.id,
        resumen.ventas.filter((v) => v.registro_id === r.id)
      );
    }
    return map;
  }, [resumen]);

  const gastosPorFecha = useMemo(() => {
    const map = new Map<string, ResumenGastoItem[]>();
    if (!resumen) return map;
    for (const g of resumen.gastos) {
      const lista = map.get(g.fecha) ?? [];
      lista.push(g);
      map.set(g.fecha, lista);
    }
    return map;
  }, [resumen]);

  function toggleRegistro(id: string) {
    setExpandedRegistros((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="space-y-5">
      {/* Navegación principal: Resumen / Gastos */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant={vista === "resumen" ? "default" : "outline"}
          onClick={() => setVista("resumen")}
          className="h-16 gap-2 rounded-2xl text-lg font-semibold"
        >
          <TrendingUp className="size-6" />
          Resumen
        </Button>
        <Button
          type="button"
          variant={vista === "gastos" ? "default" : "outline"}
          onClick={() => setVista("gastos")}
          className="h-16 gap-2 rounded-2xl text-lg font-semibold"
        >
          <TrendingDown className="size-6" />
          Gastos
        </Button>
      </div>

      {/* Selector de período */}
      <div className="grid grid-cols-3 gap-2">
        {PERIODOS.map((p) => (
          <Button
            key={p.id}
            type="button"
            variant={periodo === p.id ? "default" : "outline"}
            onClick={() => setPeriodo(p.id)}
            className="h-14 rounded-xl text-base font-medium"
          >
            {p.label}
          </Button>
        ))}
      </div>

      {loading || !resumen || !gastos ? (
        <p className="py-10 text-center text-lg text-muted-foreground">
          Cargando…
        </p>
      ) : vista === "resumen" ? (
        <VistaResumen
          resumen={resumen}
          ventasPorRegistro={ventasPorRegistro}
          gastosPorFecha={gastosPorFecha}
          expandedRegistros={expandedRegistros}
          toggleRegistro={toggleRegistro}
        />
      ) : (
        <VistaGastos gastos={gastos} />
      )}
    </div>
  );
}

function VistaResumen({
  resumen,
  ventasPorRegistro,
  gastosPorFecha,
  expandedRegistros,
  toggleRegistro,
}: {
  resumen: ResumenData;
  ventasPorRegistro: Map<string, VentaItem[]>;
  gastosPorFecha: Map<string, ResumenGastoItem[]>;
  expandedRegistros: Set<string>;
  toggleRegistro: (id: string) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Tarjetas de totales */}
      <div className="space-y-3">
        <TarjetaTotal
          icono={<Banknote className="size-7" />}
          titulo="Cobrado"
          monto={resumen.cobrado}
          color="success"
        />
        <TarjetaTotal
          icono={<Package className="size-7" />}
          titulo="Bidones vendidos"
          monto={
            resumen.bidonesVendidos > 0 ? resumen.bidonesVendidos : "—"
          }
          color="primary"
          esNumero
        />
        <TarjetaTotal
          icono={<TrendingDown className="size-7" />}
          titulo="Gastos"
          monto={resumen.gastosTotales}
          color="danger"
        />
        <TarjetaTotal
          icono={<TrendingUp className="size-7" />}
          titulo="Ganancia neta"
          monto={resumen.gananciaNeta}
          color={resumen.gananciaNeta >= 0 ? "success" : "danger"}
        />
      </div>

      {/* Lista de días */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Días del período</h3>
        {resumen.registros.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <CalendarDays className="mx-auto mb-4 size-14 text-muted-foreground" />
            <p className="text-lg font-medium text-foreground">
              No hay registros
            </p>
            <p className="mt-1 text-base text-muted-foreground">
              En este período no cargaste ningún día.
            </p>
          </div>
        ) : (
          resumen.registros.map((r) => {
            const ventas = ventasPorRegistro.get(r.id) ?? [];
            const gastosDia = gastosPorFecha.get(r.fecha) ?? [];
            const expandido = expandedRegistros.has(r.id);

            return (
              <Card key={r.id} className="border-border">
                <button
                  type="button"
                  onClick={() => toggleRegistro(r.id)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-medium capitalize text-muted-foreground">
                      {formatearFecha(r.fecha, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                    <p className="text-3xl font-bold text-success">
                      {formatearDinero(r.total_cobrado)}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                    {expandido ? (
                      <ChevronUp className="size-6 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-6 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {expandido && (
                  <CardContent className="border-t border-border p-5 pt-4">
                    <div className="space-y-5">
                      {ventas.length > 0 && (
                        <div>
                          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Ventas
                          </p>
                          <ul className="space-y-2 text-base">
                            {ventas.map((v) => (
                              <li
                                key={v.producto}
                                className="flex items-center justify-between"
                              >
                                <span className="text-muted-foreground">
                                  {v.cantidad}{" "}
                                  {etiquetaProducto(v.producto).toLowerCase()}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {gastosDia.length > 0 && (
                        <div>
                          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Gastos del día
                          </p>
                          <ul className="space-y-2 text-base">
                            {gastosDia.map((g, i) => (
                              <li
                                key={i}
                                className="flex items-center justify-between"
                              >
                                <span className="text-muted-foreground">
                                  {g.monto > 0 ? "Gasto variado" : "Recarga"}
                                </span>
                                <span className="font-semibold text-danger">
                                  {formatearDinero(g.monto)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {r.notas && (
                        <div className="rounded-xl bg-secondary/40 p-4">
                          <p className="text-base leading-relaxed text-foreground">
                            {r.notas}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function TarjetaTotal({
  icono,
  titulo,
  monto,
  color,
  esNumero = false,
}: {
  icono: React.ReactNode;
  titulo: string;
  monto: number | string;
  color: "success" | "danger" | "primary";
  esNumero?: boolean;
}) {
  const colorClasses = {
    success: "bg-success/10 text-success",
    danger: "bg-danger/10 text-danger",
    primary: "bg-primary/10 text-primary",
  };

  const textClasses = {
    success: "text-success",
    danger: "text-danger",
    primary: "text-foreground",
  };

  return (
    <Card className="border-border">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${colorClasses[color]}`}
        >
          {icono}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base text-muted-foreground">{titulo}</p>
          <p className={`text-3xl font-bold ${textClasses[color]}`}>
            {esNumero ? monto : formatearDinero(Number(monto))}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function VistaGastos({
  gastos,
}: {
  gastos: GastoItem[];
}) {
  if (!gastos || gastos.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <TrendingDown className="mx-auto mb-4 size-14 text-muted-foreground" />
        <p className="text-lg font-medium text-foreground">No hay gastos</p>
        <p className="mt-1 text-base text-muted-foreground">
          En este período no registraste gastos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {gastos.map((g) => {
        const categoriaLabel = CATEGORIAS_GASTO.find(
          (c) => c.id === g.categoria
        )?.label;

        return (
          <Card key={`${g.tipo}-${g.id}`} className="border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="break-words text-lg font-medium">
                    {g.descripcion}
                  </p>
                  <p className="mt-1 text-base text-muted-foreground">
                    {formatearFecha(g.fecha, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                  <span
                    className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-medium ${
                      g.tipo === "fabrica"
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {g.tipo === "fabrica" ? "Fábrica" : categoriaLabel}
                  </span>
                </div>
                <p className="shrink-0 text-2xl font-bold text-danger">
                  {formatearDinero(g.monto)}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
