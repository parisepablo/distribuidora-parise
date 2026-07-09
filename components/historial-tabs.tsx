"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

type Periodo = "hoy" | "semana" | "mes";

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: "hoy", label: "Hoy" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mes" },
];

export function HistorialTabs() {
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<Awaited<
    ReturnType<typeof getHistorialResumen>
  > | null>(null);
  const [gastos, setGastos] = useState<Awaited<
    ReturnType<typeof getHistorialGastos>
  > | null>(null);
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
    const map = new Map<string, { producto: ProductoId; cantidad: number }[]>();
    if (!resumen) return map;
    for (const r of resumen.registros) {
      map.set(
        r.id,
        resumen.ventas.filter((v) => v.registro_id === r.id)
      );
    }
    return map;
  }, [resumen]);

  type GastoDia = {
    fecha: string;
    monto: number;
  };

  const gastosPorFecha = useMemo(() => {
    const map = new Map<string, GastoDia[]>();
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
    <Tabs defaultValue="resumen" className="w-full">
      <TabsList className="grid h-14 w-full grid-cols-2 rounded-2xl bg-card p-1">
        <TabsTrigger
          value="resumen"
          className="rounded-xl text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Resumen
        </TabsTrigger>
        <TabsTrigger
          value="gastos"
          className="rounded-xl text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Gastos
        </TabsTrigger>
      </TabsList>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {PERIODOS.map((p) => (
          <Button
            key={p.id}
            type="button"
            variant={periodo === p.id ? "default" : "outline"}
            onClick={() => setPeriodo(p.id)}
            className="h-12 rounded-xl text-sm font-medium sm:text-base"
          >
            {p.label}
          </Button>
        ))}
      </div>

      <TabsContent value="resumen" className="mt-5 space-y-4">
        {loading || !resumen ? (
          <p className="py-8 text-center text-base text-muted-foreground">
            Cargando…
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Card className="border-border">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                    <Banknote className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Cobrado</p>
                    <p className="text-2xl font-bold text-success">
                      {formatearDinero(resumen.cobrado)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Package className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">
                      Bidones vendidos
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {resumen.bidonesVendidos > 0
                        ? resumen.bidonesVendidos
                        : "—"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
                    <TrendingDown className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Gastos</p>
                    <p className="text-2xl font-bold text-danger">
                      {formatearDinero(resumen.gastosTotales)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent-foreground">
                    <TrendingUp className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">
                      Ganancia neta
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        resumen.gananciaNeta >= 0
                          ? "text-success"
                          : "text-danger"
                      }`}
                    >
                      {formatearDinero(resumen.gananciaNeta)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Días del período</h3>
              {resumen.registros.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-8 text-center">
                  <Package className="mx-auto mb-4 size-14 text-muted-foreground" />
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
                        className="flex w-full items-center justify-between gap-3 p-4 text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-medium capitalize">
                            {formatearFecha(r.fecha, {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                          </p>
                          <p className="text-2xl font-bold text-success">
                            {formatearDinero(r.total_cobrado)}
                          </p>
                        </div>
                        <div className="shrink-0">
                          {expandido ? (
                            <ChevronUp className="size-6 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="size-6 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {expandido && (
                        <CardContent className="border-t border-border p-4 pt-4">
                          <div className="space-y-4">
                            {ventas.length > 0 && (
                              <div>
                                <p className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
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
                                        {etiquetaProducto(
                                          v.producto
                                        ).toLowerCase()}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {gastosDia.length > 0 && (
                              <div>
                                <p className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                                  Gastos del día
                                </p>
                                <ul className="space-y-2 text-base">
                                  {gastosDia.map((g, i) => (
                                    <li
                                      key={i}
                                      className="flex items-center justify-between"
                                    >
                                      <span className="text-muted-foreground">
                                        {g.monto > 0
                                          ? "Gasto variado"
                                          : "Recarga"}
                                      </span>
                                      <span className="font-medium text-danger">
                                        {formatearDinero(g.monto)}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {r.notas && (
                              <div className="rounded-xl bg-secondary/40 p-3">
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
          </>
        )}
      </TabsContent>

      <TabsContent value="gastos" className="mt-5 space-y-3">
        {loading || !gastos ? (
          <p className="py-8 text-center text-base text-muted-foreground">
            Cargando…
          </p>
        ) : gastos.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <TrendingDown className="mx-auto mb-4 size-14 text-muted-foreground" />
            <p className="text-lg font-medium text-foreground">
              No hay gastos
            </p>
            <p className="mt-1 text-base text-muted-foreground">
              En este período no registraste gastos.
            </p>
          </div>
        ) : (
          gastos.map((g) => {
            const categoriaLabel = CATEGORIAS_GASTO.find(
              (c) => c.id === g.categoria
            )?.label;

            return (
              <Card key={`${g.tipo}-${g.id}`} className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-base font-medium">
                        {g.descripcion}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {formatearFecha(g.fecha, {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                    </div>
                    <p className="shrink-0 text-xl font-bold text-danger">
                      {formatearDinero(g.monto)}
                    </p>
                  </div>
                  <Badge
                    variant={g.tipo === "fabrica" ? "default" : "secondary"}
                    className="mt-3"
                  >
                    {g.tipo === "fabrica" ? "Fábrica" : categoriaLabel}
                  </Badge>
                </CardContent>
              </Card>
            );
          })
        )}
      </TabsContent>
    </Tabs>
  );
}
